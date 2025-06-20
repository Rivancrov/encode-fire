import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("NASA_FIRMS_API_KEY")
print(f"Testing NASA FIRMS API with key: {api_key[:10]}...")

# Test different source names
sources = ['MODIS_NRT', 'MODIS_C6', 'VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_C2', 'MODIS', 'VIIRS']

for source in sources:
    url = f'https://firms.modaps.eosdis.nasa.gov/api/country/csv/{api_key}/{source}/IND/1'
    try:
        print(f"\nTesting {source}...")
        response = requests.get(url, timeout=10)
        print(f'Status: {response.status_code}, Length: {len(response.text)}')
        
        if response.status_code == 200 and len(response.text) > 100:
            lines = response.text.strip().split('\n')
            print(f'Lines: {len(lines)}')
            print(f'Headers: {lines[0]}')
            if len(lines) > 1:
                print(f'Sample data: {lines[1]}')
                break
        elif "Invalid source" in response.text:
            print(f'Invalid source: {source}')
        else:
            print(f'Response: {response.text[:200]}')
            
    except Exception as e:
        print(f'Error: {e}')