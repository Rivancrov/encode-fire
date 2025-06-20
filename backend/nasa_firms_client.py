import requests
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class NASAFirmsClient:
    def __init__(self):
        self.api_key = os.getenv("NASA_FIRMS_API_KEY")
        self.base_url = "https://firms.modaps.eosdis.nasa.gov/api"
        
    def get_fire_data(self, 
                     source: str = "MODIS_NRT",
                     region: str = "78,20,88,32",  # Northern India bounds
                     date_range: int = 1,
                     date: Optional[str] = None) -> List[Dict]:
        """
        Fetch fire data from NASA FIRMS API
        
        Args:
            source: Data source (MODIS_NRT, VIIRS_SNPP_NRT, VIIRS_NOAA20_NRT)
            region: Bounding box as "west,south,east,north"
            date_range: Number of days back from today
            date: Specific date in YYYY-MM-DD format
        """
        if not date:
            date = (datetime.now() - timedelta(days=date_range)).strftime("%Y-%m-%d")
            
        url = f"{self.base_url}/country/csv/{self.api_key}/{source}/IND/{date_range}"
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Parse CSV response
            lines = response.text.strip().split('\n')
            if len(lines) < 2:
                return []
                
            headers = lines[0].split(',')
            fires = []
            
            for line in lines[1:]:
                values = line.split(',')
                if len(values) >= len(headers):
                    fire_data = dict(zip(headers, values))
                    
                    # Filter for Northern India region
                    lat = float(fire_data.get('latitude', 0))
                    lon = float(fire_data.get('longitude', 0))
                    
                    if 20 <= lat <= 32 and 78 <= lon <= 88:
                        try:
                            # Parse numeric fields safely
                            confidence = fire_data.get('confidence', '0')
                            confidence = int(confidence) if confidence.isdigit() else 0
                            
                            brightness = fire_data.get('brightness', '0')
                            brightness = float(brightness) if brightness.replace('.', '').isdigit() else 0.0
                            
                            scan = fire_data.get('scan', '0')
                            scan = float(scan) if scan.replace('.', '').isdigit() else 0.0
                            
                            track = fire_data.get('track', '0')
                            track = float(track) if track.replace('.', '').isdigit() else 0.0
                            
                            bright_t31 = fire_data.get('bright_t31', '')
                            bright_t31 = float(bright_t31) if bright_t31 and bright_t31.replace('.', '').isdigit() else None
                            
                            frp = fire_data.get('frp', '')
                            frp = float(frp) if frp and frp.replace('.', '').isdigit() else None
                            
                            fire_type = fire_data.get('type', '')
                            fire_type = int(fire_type) if fire_type.isdigit() else 0
                            
                            fires.append({
                                'latitude': lat,
                                'longitude': lon,
                                'confidence': confidence,
                                'brightness': brightness,
                                'scan': scan,
                                'track': track,
                                'acq_date': fire_data.get('acq_date', ''),
                                'acq_time': fire_data.get('acq_time', ''),
                                'satellite': fire_data.get('satellite', ''),
                                'instrument': fire_data.get('instrument', ''),
                                'version': fire_data.get('version', ''),
                                'bright_t31': bright_t31,
                                'frp': frp,
                                'daynight': fire_data.get('daynight', ''),
                                'type': fire_type,
                                'source': source
                            })
                        except (ValueError, TypeError) as e:
                            print(f"Error parsing fire data: {e}, data: {fire_data}")
                            continue
                        
            return fires
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching NASA FIRMS data: {e}")
            return []
    
    def get_multiple_sources_data(self, 
                                date_range: int = 1,
                                sources: List[str] = None) -> List[Dict]:
        """Get data from multiple NASA FIRMS sources"""
        if not sources:
            sources = ["MODIS_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"]
            
        all_fires = []
        for source in sources:
            fires = self.get_fire_data(source=source, date_range=date_range)
            all_fires.extend(fires)
            
        return all_fires
    
    def remove_duplicates(self, fires: List[Dict], time_window_hours: int = 2) -> List[Dict]:
        """Remove duplicate fire detections within time window"""
        unique_fires = []
        
        for fire in fires:
            is_duplicate = False
            fire_datetime = datetime.strptime(f"{fire['acq_date']} {fire['acq_time']}", "%Y-%m-%d %H%M")
            
            for existing in unique_fires:
                existing_datetime = datetime.strptime(f"{existing['acq_date']} {existing['acq_time']}", "%Y-%m-%d %H%M")
                
                # Check if within time window and same location (within 1km)
                time_diff = abs((fire_datetime - existing_datetime).total_seconds() / 3600)
                lat_diff = abs(fire['latitude'] - existing['latitude'])
                lon_diff = abs(fire['longitude'] - existing['longitude'])
                
                if (time_diff <= time_window_hours and 
                    lat_diff < 0.01 and lon_diff < 0.01):  # ~1km threshold
                    is_duplicate = True
                    break
                    
            if not is_duplicate:
                unique_fires.append(fire)
                
        return unique_fires