#!/usr/bin/env python3
"""Add sample fire data for demonstration purposes"""

from database import SessionLocal, FireDetection, FirePrediction
from datetime import datetime, timedelta
import random

def add_sample_fires():
    db = SessionLocal()
    
    # Sample coordinates around Northern India
    sample_locations = [
        (30.3165, 76.3612),  # Chandigarh area
        (28.7041, 77.1025),  # Delhi area  
        (26.9124, 75.7873),  # Jaipur area
        (31.1471, 75.3412),  # Ludhiana area
        (30.7333, 76.7794),  # Chandigarh area
        (29.9457, 78.1642),  # Haridwar area
        (28.3949, 77.3178),  # Gurgaon area
        (30.9010, 75.8573),  # Ludhiana area
    ]
    
    # Add sample fire detections from last few days
    for i, (lat, lon) in enumerate(sample_locations):
        # Add some random variation to coordinates
        lat_var = lat + random.uniform(-0.5, 0.5)
        lon_var = lon + random.uniform(-0.5, 0.5)
        
        # Create date from last 3 days
        days_ago = random.randint(0, 3)
        fire_date = datetime.now() - timedelta(days=days_ago)
        
        fire = FireDetection(
            latitude=lat_var,
            longitude=lon_var,
            confidence=random.randint(65, 95),
            brightness=random.uniform(320, 380),
            scan=random.uniform(0.8, 1.2),
            track=random.uniform(0.8, 1.2),
            acq_date=fire_date.strftime("%Y-%m-%d"),
            acq_time=f"{random.randint(8, 18):02d}{random.randint(0, 59):02d}",
            satellite="Terra" if i % 2 == 0 else "Aqua",
            instrument="MODIS",
            version="6.1NRT",
            bright_t31=random.uniform(290, 310),
            frp=random.uniform(5, 25),
            daynight="D" if random.random() > 0.3 else "N",
            type=0,
            source="MODIS_NRT" if i % 3 == 0 else "VIIRS_SNPP_NRT" if i % 3 == 1 else "USER_REPORTED"
        )
        
        db.add(fire)
    
    # Add some sample predictions
    for i, (lat, lon) in enumerate(sample_locations[:4]):
        lat_var = lat + random.uniform(-0.3, 0.3)
        lon_var = lon + random.uniform(-0.3, 0.3)
        
        prob = random.uniform(0.4, 0.9)
        risk_level = "HIGH" if prob > 0.7 else "MEDIUM" if prob > 0.5 else "LOW"
        
        prediction = FirePrediction(
            latitude=lat_var,
            longitude=lon_var,
            prediction_date=datetime.now() + timedelta(days=7),
            probability=prob,
            risk_level=risk_level,
            model_version="1.0",
            features_used="lat,lon,temporal,seasonal,historical"
        )
        
        db.add(prediction)
    
    db.commit()
    db.close()
    
    print(f"✅ Added {len(sample_locations)} sample fire detections")
    print(f"✅ Added {len(sample_locations[:4])} sample predictions")
    print("🔥 Sample data is now available in the web application!")

if __name__ == "__main__":
    add_sample_fires()