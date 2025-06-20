from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import uvicorn

from database import create_tables, get_db, FireDetection, FirePrediction, UserFireReport
from nasa_firms_client import NASAFirmsClient
from ml_model import FirePredictionModel
from claude_agent import ClaudeFireAgent

app = FastAPI(title="Fire Detection & Prediction API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
nasa_client = NASAFirmsClient()
ml_model = FirePredictionModel()
claude_agent = ClaudeFireAgent()

# Create database tables
create_tables()

@app.on_event("startup")
async def startup_event():
    """Initialize ML model on startup"""
    ml_model.load_model()

@app.get("/")
async def root():
    return {"message": "Fire Detection & Prediction API"}

@app.post("/api/refresh-fire-data")
async def refresh_fire_data(
    sources: List[str] = Query(default=["MODIS_C6_1", "VIIRS_SNPP_C2"]),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    region: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    """Refresh fire data from NASA FIRMS API with filters"""
    try:
        # Calculate date range
        if not start_date:
            start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
        
        # Calculate days between dates
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        days_diff = (end_dt - start_dt).days + 1
        
        all_fires = []
        for source in sources:
            fires = nasa_client.get_fire_data(
                source=source,
                date_range=days_diff
            )
            all_fires.extend(fires)
        
        # Remove duplicates
        unique_fires = nasa_client.remove_duplicates(all_fires)
        
        # Store in database
        new_fires_count = 0
        for fire_data in unique_fires:
            # Check if fire already exists
            existing = db.query(FireDetection).filter(
                FireDetection.latitude == fire_data['latitude'],
                FireDetection.longitude == fire_data['longitude'],
                FireDetection.acq_date == fire_data['acq_date'],
                FireDetection.acq_time == fire_data['acq_time']
            ).first()
            
            if not existing:
                fire = FireDetection(**fire_data)
                db.add(fire)
                new_fires_count += 1
        
        db.commit()
        
        return {
            "status": "success",
            "new_fires": new_fires_count,
            "total_fires": len(unique_fires),
            "sources": sources,
            "date_range": f"{start_date} to {end_date}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fire-detections")
async def get_fire_detections(
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    sources: Optional[List[str]] = Query(default=None),
    min_confidence: Optional[int] = Query(default=0),
    lat_min: Optional[float] = Query(default=20.0),
    lat_max: Optional[float] = Query(default=32.0),
    lon_min: Optional[float] = Query(default=78.0),
    lon_max: Optional[float] = Query(default=88.0),
    limit: Optional[int] = Query(default=1000),
    db: Session = Depends(get_db)
):
    """Get fire detections with filters"""
    query = db.query(FireDetection)
    
    # Apply filters
    if start_date:
        query = query.filter(FireDetection.acq_date >= start_date)
    if end_date:
        query = query.filter(FireDetection.acq_date <= end_date)
    if sources:
        query = query.filter(FireDetection.source.in_(sources))
    if min_confidence:
        query = query.filter(FireDetection.confidence >= min_confidence)
    
    query = query.filter(
        FireDetection.latitude >= lat_min,
        FireDetection.latitude <= lat_max,
        FireDetection.longitude >= lon_min,
        FireDetection.longitude <= lon_max
    )
    
    fires = query.limit(limit).all()
    
    return [{
        "id": fire.id,
        "latitude": fire.latitude,
        "longitude": fire.longitude,
        "confidence": fire.confidence,
        "brightness": fire.brightness,
        "scan": fire.scan,
        "track": fire.track,
        "acq_date": fire.acq_date,
        "acq_time": fire.acq_time,
        "satellite": fire.satellite,
        "instrument": fire.instrument,
        "source": fire.source,
        "frp": fire.frp,
        "daynight": fire.daynight,
        "created_at": fire.created_at.isoformat() if fire.created_at else None
    } for fire in fires]

@app.get("/api/fire-detections/recent")
async def get_recent_fire_detections(
    limit: int = Query(default=3),
    db: Session = Depends(get_db)
):
    """Get most recent fire detections"""
    fires = db.query(FireDetection).order_by(
        FireDetection.created_at.desc()
    ).limit(limit).all()
    
    return [{
        "id": fire.id,
        "latitude": fire.latitude,
        "longitude": fire.longitude,
        "confidence": fire.confidence,
        "brightness": fire.brightness,
        "acq_date": fire.acq_date,
        "acq_time": fire.acq_time,
        "satellite": fire.satellite,
        "source": fire.source,
        "created_at": fire.created_at.isoformat() if fire.created_at else None
    } for fire in fires]

@app.post("/api/train-model")
async def train_prediction_model(db: Session = Depends(get_db)):
    """Train the ML prediction model"""
    try:
        # Get historical fire data
        fires = db.query(FireDetection).all()
        fire_data = [{
            'latitude': fire.latitude,
            'longitude': fire.longitude,
            'confidence': fire.confidence,
            'brightness': fire.brightness,
            'acq_date': fire.acq_date,
            'acq_time': fire.acq_time,
            'satellite': fire.satellite,
            'instrument': fire.instrument,
            'source': fire.source,
            'frp': fire.frp or 0,
            'datetime': fire.created_at
        } for fire in fires]
        
        if len(fire_data) < 100:
            raise HTTPException(status_code=400, detail="Insufficient data for model training")
        
        # Train model
        result = ml_model.train_model(fire_data)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-predictions")
async def generate_predictions(
    lat_min: float = Query(default=20.0),
    lat_max: float = Query(default=32.0),
    lon_min: float = Query(default=78.0),
    lon_max: float = Query(default=88.0),
    grid_size: float = Query(default=0.2),
    db: Session = Depends(get_db)
):
    """Generate fire predictions for a region"""
    try:
        bounds = {
            'lat_min': lat_min,
            'lat_max': lat_max,
            'lon_min': lon_min,
            'lon_max': lon_max
        }
        
        predictions = ml_model.generate_grid_predictions(bounds, grid_size)
        
        # Store predictions in database
        for pred in predictions:
            prediction = FirePrediction(
                latitude=pred['latitude'],
                longitude=pred['longitude'],
                prediction_date=datetime.now() + timedelta(days=7),
                probability=pred['probability'],
                risk_level=pred['risk_level'],
                model_version=pred['model_version'],
                features_used="lat,lon,temporal,seasonal"
            )
            db.add(prediction)
        
        db.commit()
        
        return {
            "status": "success",
            "predictions_generated": len(predictions),
            "predictions": predictions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fire-predictions")
async def get_fire_predictions(
    risk_level: Optional[str] = Query(default=None),
    min_probability: Optional[float] = Query(default=0.3),
    lat_min: Optional[float] = Query(default=20.0),
    lat_max: Optional[float] = Query(default=32.0),
    lon_min: Optional[float] = Query(default=78.0),
    lon_max: Optional[float] = Query(default=88.0),
    limit: Optional[int] = Query(default=500),
    db: Session = Depends(get_db)
):
    """Get fire predictions with filters"""
    query = db.query(FirePrediction)
    
    if risk_level:
        query = query.filter(FirePrediction.risk_level == risk_level)
    if min_probability:
        query = query.filter(FirePrediction.probability >= min_probability)
    
    query = query.filter(
        FirePrediction.latitude >= lat_min,
        FirePrediction.latitude <= lat_max,
        FirePrediction.longitude >= lon_min,
        FirePrediction.longitude <= lon_max
    )
    
    predictions = query.limit(limit).all()
    
    return [{
        "id": pred.id,
        "latitude": pred.latitude,
        "longitude": pred.longitude,
        "probability": pred.probability,
        "risk_level": pred.risk_level,
        "prediction_date": pred.prediction_date.isoformat(),
        "model_version": pred.model_version,
        "created_at": pred.created_at.isoformat()
    } for pred in predictions]

@app.post("/api/report-fire")
async def report_fire(
    fire_report: Dict,
    db: Session = Depends(get_db)
):
    """Report a user fire sighting"""
    try:
        result = claude_agent.report_fire(
            latitude=fire_report['latitude'],
            longitude=fire_report['longitude'],
            description=fire_report.get('description', ''),
            reporter_name=fire_report.get('reporter_name', ''),
            reporter_contact=fire_report.get('reporter_contact', '')
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_with_agent(
    message: Dict
):
    """Chat with the Claude fire detection agent"""
    try:
        user_message = message.get('message', '')
        response = claude_agent.chat(user_message)
        
        return {
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fire-statistics")
async def get_fire_statistics(
    time_period: str = Query(default="week"),
    group_by: str = Query(default="source"),
    db: Session = Depends(get_db)
):
    """Get fire statistics"""
    try:
        stats = claude_agent.get_fire_statistics(time_period, group_by)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)