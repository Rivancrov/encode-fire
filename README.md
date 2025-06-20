# 🔥 Stubble Burning Fire Detection & Prediction System

A comprehensive React web application for detecting, reporting, and predicting stubble burning fires in Northern India using NASA FIRMS data and machine learning.

## ✨ Features

### 🗺️ Fire Detection Map
- **Interactive Map**: Shows all fire instances as clickable markers with detailed information
- **Multiple Data Sources**: Integrates NASA FIRMS (MODIS, VIIRS) and user-reported fires
- **Advanced Filtering**: Date range, source type, confidence level, and geographic region filters
- **Real-time Updates**: Refresh data from NASA FIRMS API with current filters
- **Duplicate Prevention**: Automatically removes duplicate detections within 2-hour windows
- **Recent Fire Tracking**: Displays 3 most recent fire detections with detailed information

### 🤖 Fire Prediction Map
- **ML Predictions**: Random Forest Regressor model for fire likelihood prediction
- **Risk Levels**: High, Medium, and Low risk areas with probability scores
- **Time-based Forecasts**: Next 7, 15, and 30-day predictions
- **Model Performance**: Training metrics and accuracy indicators
- **High Confidence Focus**: Only displays predictions above confidence thresholds

### 📚 Educational Impact Page
- **Environmental Impact**: Air quality statistics and pollution data
- **Health Effects**: Comprehensive health impact analysis and distribution
- **Economic Analysis**: Healthcare costs, agricultural losses, and economic burden
- **Alternative Practices**: Success stories and adoption rates of sustainable methods
- **Government Initiatives**: Policy timeline and budget allocations

### 🤝 AI Assistant Chatbot
- **Claude Integration**: Powered by Claude API with specialized fire detection knowledge
- **Tool Access**: Query fire data, predictions, and statistics through natural language
- **Fire Reporting**: Guide users through the fire reporting process
- **Real-time Data**: Access to current fire detection and prediction databases

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM with SQLite
- **NASA FIRMS API**: Real-time satellite fire data
- **Scikit-learn**: Machine learning with Random Forest
- **Claude API**: AI assistant integration
- **Pandas/NumPy**: Data processing and analysis

### Frontend
- **React 18**: Modern component-based UI
- **TypeScript**: Type-safe development
- **Ant Design**: Professional UI components
- **React Leaflet**: Interactive mapping with OpenStreetMap
- **Recharts**: Data visualization and charts
- **Axios**: HTTP client for API communication

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd encode-fire
```

### 2. Configure Environment
Update the `.env` file with your API keys:
```bash
NASA_FIRMS_API_KEY=your_nasa_firms_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
DATABASE_URL=sqlite:///./fire_detection.db
```

Get your NASA FIRMS API key from: https://firms.modaps.eosdis.nasa.gov/api/
Get your Claude API key from: https://console.anthropic.com/

### 3. Start Backend
```bash
./start-backend.sh
```
This will:
- Create Python virtual environment
- Install dependencies
- Setup database tables
- Start FastAPI server on http://localhost:8000

### 4. Start Frontend
```bash
./start-frontend.sh
```
This will:
- Install npm dependencies
- Start React development server on http://localhost:3000

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📖 Usage Guide

### Fire Detection Page
1. **View Current Fires**: Default view shows recent fire detections
2. **Apply Filters**: Use date range, source type, and geographic filters
3. **Refresh Data**: Click "Refresh Data" to fetch latest NASA FIRMS data
4. **Explore Map**: Click markers for detailed fire information
5. **Recent Fires**: Monitor the 3 most recent detections in the sidebar

### Fire Prediction Page
1. **Train Model**: Click "Train Model" to build ML predictions from historical data
2. **Generate Predictions**: Create new predictions for the next 7 days
3. **Filter Predictions**: Adjust risk level and probability thresholds
4. **Analyze Risk**: View high, medium, and low risk areas on the map

### Education Page
1. **Learn Impact**: Explore environmental, health, and economic effects
2. **View Statistics**: Interactive charts showing pollution correlation
3. **Alternative Practices**: Discover sustainable farming methods
4. **Success Stories**: Read about successful implementation cases

### AI Assistant
1. **Ask Questions**: Natural language queries about fire data
2. **Report Fires**: Get guided assistance for reporting new fires
3. **Get Statistics**: Request analysis of fire patterns and trends
4. **Learn More**: Ask about fire detection, prediction, or prevention

## 🔧 API Endpoints

### Fire Detection
- `POST /api/refresh-fire-data` - Fetch new data from NASA FIRMS
- `GET /api/fire-detections` - Get fire detections with filters
- `GET /api/fire-detections/recent` - Get most recent detections

### Fire Prediction
- `POST /api/train-model` - Train ML prediction model
- `POST /api/generate-predictions` - Generate new predictions
- `GET /api/fire-predictions` - Get predictions with filters

### User Interaction
- `POST /api/report-fire` - Submit user fire report
- `POST /api/chat` - Chat with AI assistant
- `GET /api/fire-statistics` - Get fire statistics and analysis

## 🤖 Machine Learning Model

### Features Used
- Historical fire density patterns
- Geographic coordinates and grid analysis
- Temporal features (month, day of year, hour)
- Seasonal indicators (peak burning seasons)
- Fire characteristics (brightness, confidence, power)
- Weather and environmental factors

### Model Performance
- **Algorithm**: Random Forest Regressor
- **Training Data**: Historical NASA FIRMS detections
- **Validation**: Time-series cross-validation
- **Metrics**: R² score, Mean Squared Error
- **Prediction Horizon**: 7-30 days

### Risk Categories
- **High Risk**: ≥70% probability
- **Medium Risk**: 40-69% probability  
- **Low Risk**: 30-39% probability

## 🗄️ Database Schema

### Fire Detections
- Geographic coordinates and metadata
- Satellite source and instrument details
- Confidence levels and fire characteristics
- Temporal information and detection timestamps

### Fire Predictions
- Predicted coordinates and probability scores
- Risk level classification
- Model version and feature metadata
- Prediction timestamps and validity periods

### User Reports
- User-submitted fire locations
- Reporter contact information
- Description and verification status
- Integration with detection database

## 🌍 Geographic Coverage

**Primary Focus**: Northern India
- **States**: Punjab, Haryana, Uttar Pradesh, Uttarakhand, Himachal Pradesh, Rajasthan, Delhi, Bihar
- **Coordinates**: 20°N to 32°N, 78°E to 88°E
- **Resolution**: 0.1° grid cells for predictions
- **Data Sources**: NASA MODIS and VIIRS satellites

## 📊 Data Sources

### NASA FIRMS API
- **MODIS Collection 6.1**: 1km resolution, daily coverage
- **VIIRS SNPP Collection 2**: 375m resolution, daily coverage  
- **VIIRS NOAA-20 Collection 2**: 375m resolution, daily coverage
- **Update Frequency**: Real-time, processed within 3 hours
- **Historical Data**: Available from 2000+ (MODIS) and 2012+ (VIIRS)

### User Contributions
- Community-reported fire sightings
- Verification and validation system
- Integration with satellite data
- Quality control and filtering

## 🔧 Manual Setup (Alternative)

If the startup scripts don't work, you can set up manually:

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -c "from database import create_tables; create_tables()"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🎯 Key Features Demonstration

### 1. Real-time Fire Data
- Connects to NASA FIRMS API for latest satellite detections
- Filters and deduplicates fire data automatically
- Color-codes by satellite source (MODIS=red, VIIRS=orange, User=blue)

### 2. Machine Learning Predictions
- Trains Random Forest model on historical fire patterns
- Considers seasonal trends, geographic factors, and weather patterns
- Generates grid-based predictions with confidence scores

### 3. Interactive Maps
- Click fire markers for detailed popup information
- Zoom and pan across Northern India region
- Legend showing different fire sources and risk levels

### 4. AI Assistant
- Ask "Show me recent fires in Punjab"
- Request "What areas have high fire risk?"
- Report fires through natural conversation

### 5. Educational Content
- Charts showing air quality impact during fire season
- Economic analysis of stubble burning costs
- Success stories of alternative farming practices

## 🔒 Security Features

- API key management for external services
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure database operations
- User report moderation system

## 🚨 Troubleshooting

### Common Issues
1. **Backend won't start**: Check Python version (3.8+) and virtual environment
2. **Frontend build errors**: Ensure Node.js 16+ and clear node_modules if needed
3. **API errors**: Verify NASA FIRMS API key in .env file
4. **Map not loading**: Check internet connection for OpenStreetMap tiles
5. **ML model errors**: Ensure sufficient training data exists

### Getting Help
- Check the API documentation at http://localhost:8000/docs
- Review browser console for frontend errors
- Check terminal output for backend errors
- Verify all dependencies are installed correctly

## 📈 Performance Optimizations

- Map marker clustering for dense areas
- Progressive data loading based on zoom level
- Efficient database indexing
- Caching strategies for frequently accessed data
- Background job processing for ML predictions
- Lazy loading of components

## 🎯 Future Enhancements

- Weather data integration for improved predictions
- Mobile application development
- SMS/email alert system
- Integration with government monitoring systems
- Multi-language support
- Advanced satellite imagery analysis
- Drone surveillance integration
- Social media monitoring for fire reports

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for environmental protection and community safety**

*This system helps monitor and predict stubble burning in Northern India, contributing to better air quality and public health outcomes.*