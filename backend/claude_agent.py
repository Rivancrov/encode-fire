import anthropic
import json
import os
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from database import FireDetection, FirePrediction, UserFireReport, get_db
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

class ClaudeFireAgent:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))
        self.available_tools = [
            {
                "name": "get_fire_detections",
                "description": "Get fire detection data with optional filters",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                        "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                        "source": {"type": "string", "description": "Fire source (MODIS, VIIRS, USER_REPORTED)"},
                        "min_confidence": {"type": "integer", "description": "Minimum confidence level"},
                        "lat_min": {"type": "number", "description": "Minimum latitude"},
                        "lat_max": {"type": "number", "description": "Maximum latitude"},
                        "lon_min": {"type": "number", "description": "Minimum longitude"},
                        "lon_max": {"type": "number", "description": "Maximum longitude"}
                    }
                }
            },
            {
                "name": "get_fire_predictions",
                "description": "Get fire prediction data",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "risk_level": {"type": "string", "description": "Risk level (LOW, MEDIUM, HIGH)"},
                        "min_probability": {"type": "number", "description": "Minimum probability threshold"},
                        "lat_min": {"type": "number", "description": "Minimum latitude"},
                        "lat_max": {"type": "number", "description": "Maximum latitude"},
                        "lon_min": {"type": "number", "description": "Minimum longitude"},
                        "lon_max": {"type": "number", "description": "Maximum longitude"}
                    }
                }
            },
            {
                "name": "report_fire",
                "description": "Report a new fire sighting",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "latitude": {"type": "number", "description": "Fire latitude"},
                        "longitude": {"type": "number", "description": "Fire longitude"},
                        "description": {"type": "string", "description": "Fire description"},
                        "reporter_name": {"type": "string", "description": "Reporter name"},
                        "reporter_contact": {"type": "string", "description": "Reporter contact"}
                    },
                    "required": ["latitude", "longitude"]
                }
            },
            {
                "name": "get_fire_statistics",
                "description": "Get fire statistics and analysis",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "time_period": {"type": "string", "description": "Time period (day, week, month, year)"},
                        "group_by": {"type": "string", "description": "Group by (source, region, confidence)"}
                    }
                }
            }
        ]
    
    def get_fire_detections(self, **filters) -> List[Dict]:
        """Get fire detections from database with filters"""
        db = next(get_db())
        query = db.query(FireDetection)
        
        if filters.get('start_date'):
            query = query.filter(FireDetection.acq_date >= filters['start_date'])
        if filters.get('end_date'):
            query = query.filter(FireDetection.acq_date <= filters['end_date'])
        if filters.get('source'):
            query = query.filter(FireDetection.source == filters['source'])
        if filters.get('min_confidence'):
            query = query.filter(FireDetection.confidence >= filters['min_confidence'])
        if filters.get('lat_min'):
            query = query.filter(FireDetection.latitude >= filters['lat_min'])
        if filters.get('lat_max'):
            query = query.filter(FireDetection.latitude <= filters['lat_max'])
        if filters.get('lon_min'):
            query = query.filter(FireDetection.longitude >= filters['lon_min'])
        if filters.get('lon_max'):
            query = query.filter(FireDetection.longitude <= filters['lon_max'])
        
        fires = query.limit(1000).all()  # Limit for performance
        db.close()
        
        return [{
            'id': fire.id,
            'latitude': fire.latitude,
            'longitude': fire.longitude,
            'confidence': fire.confidence,
            'brightness': fire.brightness,
            'acq_date': fire.acq_date,
            'acq_time': fire.acq_time,
            'satellite': fire.satellite,
            'source': fire.source,
            'frp': fire.frp
        } for fire in fires]
    
    def get_fire_predictions(self, **filters) -> List[Dict]:
        """Get fire predictions from database with filters"""
        db = next(get_db())
        query = db.query(FirePrediction)
        
        if filters.get('risk_level'):
            query = query.filter(FirePrediction.risk_level == filters['risk_level'])
        if filters.get('min_probability'):
            query = query.filter(FirePrediction.probability >= filters['min_probability'])
        if filters.get('lat_min'):
            query = query.filter(FirePrediction.latitude >= filters['lat_min'])
        if filters.get('lat_max'):
            query = query.filter(FirePrediction.latitude <= filters['lat_max'])
        if filters.get('lon_min'):
            query = query.filter(FirePrediction.longitude >= filters['lon_min'])
        if filters.get('lon_max'):
            query = query.filter(FirePrediction.longitude <= filters['lon_max'])
        
        predictions = query.limit(500).all()
        db.close()
        
        return [{
            'id': pred.id,
            'latitude': pred.latitude,
            'longitude': pred.longitude,
            'probability': pred.probability,
            'risk_level': pred.risk_level,
            'prediction_date': pred.prediction_date.isoformat(),
            'model_version': pred.model_version
        } for pred in predictions]
    
    def report_fire(self, latitude: float, longitude: float, description: str = "", 
                   reporter_name: str = "", reporter_contact: str = "") -> Dict:
        """Report a new fire sighting"""
        db = next(get_db())
        
        # Create user fire report
        fire_report = UserFireReport(
            latitude=latitude,
            longitude=longitude,
            description=description,
            reporter_name=reporter_name,
            reporter_contact=reporter_contact
        )
        
        db.add(fire_report)
        
        # Also add to fire detections as user-reported
        fire_detection = FireDetection(
            latitude=latitude,
            longitude=longitude,
            confidence=50,  # Default for user reports
            brightness=0,
            acq_date=datetime.now().strftime("%Y-%m-%d"),
            acq_time=datetime.now().strftime("%H%M"),
            satellite="USER_REPORT",
            instrument="VISUAL",
            source="USER_REPORTED"
        )
        
        db.add(fire_detection)
        db.commit()
        
        fire_id = fire_detection.id
        db.close()
        
        return {
            "status": "success",
            "fire_id": fire_id,
            "message": "Fire reported successfully. Thank you for the report!"
        }
    
    def get_fire_statistics(self, time_period: str = "week", group_by: str = "source") -> Dict:
        """Get fire statistics and analysis"""
        db = next(get_db())
        
        # Calculate date range
        end_date = datetime.now()
        if time_period == "day":
            start_date = end_date - timedelta(days=1)
        elif time_period == "week":
            start_date = end_date - timedelta(weeks=1)
        elif time_period == "month":
            start_date = end_date - timedelta(days=30)
        else:  # year
            start_date = end_date - timedelta(days=365)
        
        start_date_str = start_date.strftime("%Y-%m-%d")
        
        query = db.query(FireDetection).filter(FireDetection.acq_date >= start_date_str)
        fires = query.all()
        
        stats = {
            "total_fires": len(fires),
            "time_period": time_period,
            "date_range": f"{start_date_str} to {end_date.strftime('%Y-%m-%d')}"
        }
        
        if group_by == "source":
            source_counts = {}
            for fire in fires:
                source_counts[fire.source] = source_counts.get(fire.source, 0) + 1
            stats["by_source"] = source_counts
        
        elif group_by == "confidence":
            confidence_ranges = {"high": 0, "medium": 0, "low": 0}
            for fire in fires:
                if fire.confidence >= 80:
                    confidence_ranges["high"] += 1
                elif fire.confidence >= 50:
                    confidence_ranges["medium"] += 1
                else:
                    confidence_ranges["low"] += 1
            stats["by_confidence"] = confidence_ranges
        
        db.close()
        return stats
    
    def execute_tool(self, tool_name: str, tool_input: Dict) -> Dict:
        """Execute a tool function"""
        if tool_name == "get_fire_detections":
            return {"result": self.get_fire_detections(**tool_input)}
        elif tool_name == "get_fire_predictions":
            return {"result": self.get_fire_predictions(**tool_input)}
        elif tool_name == "report_fire":
            return self.report_fire(**tool_input)
        elif tool_name == "get_fire_statistics":
            return self.get_fire_statistics(**tool_input)
        else:
            return {"error": f"Unknown tool: {tool_name}"}
    
    def chat(self, user_message: str) -> str:
        """Main chat interface with tool use"""
        system_prompt = """You are a helpful AI assistant specializing in fire detection and prediction for stubble burning in Northern India. You have access to tools that allow you to:

1. Get fire detection data from NASA FIRMS satellites and user reports
2. Get fire prediction data from machine learning models
3. Help users report new fire sightings
4. Provide statistics and analysis of fire data

When users ask questions, use the appropriate tools to get current data and provide helpful, accurate responses. If a user wants to report a fire, use the report_fire tool with the location information they provide.

Always be helpful and provide context about the data you're showing. Explain what the different fire sources mean (MODIS, VIIRS, USER_REPORTED) and help users understand fire risk levels and predictions."""

        try:
            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                tools=self.available_tools
            )
            
            # Handle tool use
            if response.content and any(block.type == "tool_use" for block in response.content):
                tool_results = []
                
                for block in response.content:
                    if block.type == "tool_use":
                        tool_result = self.execute_tool(block.name, block.input)
                        tool_results.append({
                            "tool_use_id": block.id,
                            "content": json.dumps(tool_result)
                        })
                
                # Get final response with tool results
                follow_up = self.client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=1000,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": user_message},
                        {"role": "assistant", "content": response.content},
                        {"role": "user", "content": tool_results}
                    ]
                )
                
                return follow_up.content[0].text if follow_up.content else "I apologize, I couldn't process your request."
            
            return response.content[0].text if response.content else "I apologize, I couldn't process your request."
            
        except Exception as e:
            return f"I encountered an error: {str(e)}. Please try again."