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
        self.tools = [
            {
                "name": "get_fire_detections",
                "description": "Get fire detection data from NASA FIRMS satellites and user reports with optional filters for date range, location, confidence level, and data source",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "start_date": {"type": "string", "description": "Start date in YYYY-MM-DD format"},
                        "end_date": {"type": "string", "description": "End date in YYYY-MM-DD format"},
                        "source": {"type": "string", "description": "Fire data source: MODIS_NRT, VIIRS_SNPP_NRT, VIIRS_NOAA20_NRT, or USER_REPORTED"},
                        "min_confidence": {"type": "integer", "description": "Minimum confidence level (0-100)"},
                        "lat_min": {"type": "number", "description": "Minimum latitude for bounding box"},
                        "lat_max": {"type": "number", "description": "Maximum latitude for bounding box"},
                        "lon_min": {"type": "number", "description": "Minimum longitude for bounding box"},
                        "lon_max": {"type": "number", "description": "Maximum longitude for bounding box"}
                    }
                }
            },
            {
                "name": "get_fire_predictions",
                "description": "Get ML-based fire risk predictions for future fire probability in specified areas",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "risk_level": {"type": "string", "description": "Filter by risk level: LOW, MEDIUM, or HIGH"},
                        "min_probability": {"type": "number", "description": "Minimum probability threshold (0.0-1.0)"},
                        "lat_min": {"type": "number", "description": "Minimum latitude for bounding box"},
                        "lat_max": {"type": "number", "description": "Maximum latitude for bounding box"},
                        "lon_min": {"type": "number", "description": "Minimum longitude for bounding box"},
                        "lon_max": {"type": "number", "description": "Maximum longitude for bounding box"}
                    }
                }
            },
            {
                "name": "report_fire",
                "description": "Submit a new fire sighting report from user observation with location and description",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "latitude": {"type": "number", "description": "Latitude coordinate of fire location"},
                        "longitude": {"type": "number", "description": "Longitude coordinate of fire location"},
                        "description": {"type": "string", "description": "Description of fire sighting details"},
                        "reporter_name": {"type": "string", "description": "Name of person reporting the fire"},
                        "reporter_contact": {"type": "string", "description": "Contact information of reporter"}
                    },
                    "required": ["latitude", "longitude"]
                }
            },
            {
                "name": "get_fire_statistics",
                "description": "Get statistical analysis and summaries of fire detection data for specified time periods and groupings",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "time_period": {"type": "string", "description": "Time period for analysis: day, week, month, or year"},
                        "group_by": {"type": "string", "description": "Group statistics by: source, region, or confidence"}
                    }
                }
            },
            {
                "name": "refresh_nasa_data",
                "description": "Fetch fresh fire detection data from NASA FIRMS API and update the database",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "sources": {"type": "array", "items": {"type": "string"}, "description": "NASA FIRMS data sources to fetch: MODIS_NRT, VIIRS_SNPP_NRT, VIIRS_NOAA20_NRT"},
                        "days_back": {"type": "integer", "description": "Number of days back to fetch data (1-10)"}
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
        try:
            if tool_name == "get_fire_detections":
                return {"result": self.get_fire_detections(**tool_input)}
            elif tool_name == "get_fire_predictions":
                return {"result": self.get_fire_predictions(**tool_input)}
            elif tool_name == "report_fire":
                return self.report_fire(**tool_input)
            elif tool_name == "get_fire_statistics":
                return self.get_fire_statistics(**tool_input)
            elif tool_name == "refresh_nasa_data":
                return self.refresh_nasa_data(**tool_input)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}"}
    
    def refresh_nasa_data(self, sources: List[str] = None, days_back: int = 1) -> Dict:
        """Refresh fire data from NASA FIRMS API"""
        if not sources:
            sources = ["MODIS_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"]
            
        from nasa_firms_client import NASAFirmsClient
        nasa_client = NASAFirmsClient()
        
        db = next(get_db())
        
        all_fires = []
        for source in sources:
            fires = nasa_client.get_fire_data(source=source, date_range=days_back)
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
        db.close()
        
        return {
            "status": "success",
            "new_fires": new_fires_count,
            "total_fires": len(unique_fires),
            "sources": sources,
            "message": f"Fetched {len(unique_fires)} fires from NASA FIRMS, {new_fires_count} new fires added to database"
        }
    
    def chat(self, user_message: str) -> str:
        """Main chat interface with Claude API and tool calling"""
        system_prompt = """You are an AI assistant specializing in fire detection and prediction for stubble burning in Northern India. 

You have access to several tools:
1. get_fire_detections - Get current fire detection data from NASA FIRMS satellites (MODIS, VIIRS) and user reports
2. get_fire_predictions - Get machine learning predictions for future fire risk
3. report_fire - Help users submit new fire sighting reports
4. get_fire_statistics - Provide statistical analysis of fire data
5. refresh_nasa_data - Fetch the latest fire data from NASA FIRMS API

When users ask about fires, always use the appropriate tools to get current, real data. Explain the data sources (MODIS, VIIRS satellites) and provide context about fire confidence levels, risk predictions, and geographic patterns.

Be proactive in using tools when users ask questions that would benefit from current data."""

        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ],
                tools=self.tools
            )
            
            # Handle tool use
            if response.stop_reason == "tool_use":
                tool_results = []
                
                for content_block in response.content:
                    if content_block.type == "tool_use":
                        tool_name = content_block.name
                        tool_input = content_block.input
                        tool_use_id = content_block.id
                        
                        # Execute the tool
                        tool_result = self.execute_tool(tool_name, tool_input)
                        
                        tool_results.append({
                            "tool_use_id": tool_use_id,
                            "content": json.dumps(tool_result)
                        })
                
                # Get final response with tool results
                if tool_results:
                    # Prepare messages for follow-up
                    messages = [
                        {"role": "user", "content": user_message},
                        {"role": "assistant", "content": response.content}
                    ]
                    
                    # Add tool results
                    for tool_result in tool_results:
                        messages.append({
                            "role": "user", 
                            "content": [{
                                "type": "tool_result",
                                "tool_use_id": tool_result["tool_use_id"],
                                "content": tool_result["content"]
                            }]
                        })
                    
                    follow_up_response = self.client.messages.create(
                        model="claude-3-5-sonnet-20241022",
                        max_tokens=1000,
                        system=system_prompt,
                        messages=messages
                    )
                    
                    return self._extract_text_content(follow_up_response.content)
            
            return self._extract_text_content(response.content)
            
        except Exception as e:
            return f"I encountered an error: {str(e)}. Please try again."
    
    def _extract_text_content(self, content) -> str:
        """Extract text content from Claude response"""
        if isinstance(content, list):
            text_parts = []
            for block in content:
                if hasattr(block, 'type') and block.type == 'text':
                    text_parts.append(block.text)
            return '\n'.join(text_parts)
        return str(content)