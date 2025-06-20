import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
from datetime import datetime, timedelta
import pickle
import os
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from database import FireDetection, FirePrediction, get_db

class FirePredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.model_version = "1.0"
        
    def prepare_features(self, fires_df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for ML model"""
        features_df = fires_df.copy()
        
        # Convert date/time to datetime
        features_df['datetime'] = pd.to_datetime(
            features_df['acq_date'] + ' ' + features_df['acq_time'].str[:2] + ':' + features_df['acq_time'].str[2:]
        )
        
        # Extract temporal features
        features_df['month'] = features_df['datetime'].dt.month
        features_df['day_of_year'] = features_df['datetime'].dt.dayofyear
        features_df['hour'] = features_df['datetime'].dt.hour
        features_df['is_weekend'] = features_df['datetime'].dt.weekday >= 5
        
        # Geographic features
        features_df['lat_rounded'] = (features_df['latitude'] * 10).round() / 10
        features_df['lon_rounded'] = (features_df['longitude'] * 10).round() / 10
        
        # Create grid cells for spatial aggregation
        features_df['grid_id'] = (
            features_df['lat_rounded'].astype(str) + '_' + 
            features_df['lon_rounded'].astype(str)
        )
        
        # Historical fire density features
        fire_counts = features_df.groupby(['grid_id', 'month']).size().reset_index(name='historical_count')
        features_df = features_df.merge(fire_counts, on=['grid_id', 'month'], how='left')
        features_df['historical_count'] = features_df['historical_count'].fillna(0)
        
        # Fire characteristics
        features_df['brightness_normalized'] = features_df['brightness'] / features_df['brightness'].max()
        features_df['confidence_normalized'] = features_df['confidence'] / 100.0
        features_df['frp_normalized'] = features_df['frp'] / features_df['frp'].max() if 'frp' in features_df.columns else 0
        
        # Seasonal patterns (stubble burning season indicators)
        # Peak stubble burning: October-December and March-May
        features_df['is_peak_season'] = features_df['month'].isin([3, 4, 5, 10, 11, 12])
        features_df['is_post_harvest'] = features_df['month'].isin([4, 5, 11, 12])
        
        # Select final features
        self.feature_columns = [
            'latitude', 'longitude', 'month', 'day_of_year', 'hour',
            'brightness_normalized', 'confidence_normalized', 'frp_normalized',
            'historical_count', 'is_weekend', 'is_peak_season', 'is_post_harvest'
        ]
        
        return features_df[self.feature_columns + ['grid_id']].fillna(0)
    
    def create_prediction_targets(self, features_df: pd.DataFrame, window_days: int = 7) -> pd.DataFrame:
        """Create target variables for prediction"""
        # Group by grid cell and create future fire occurrence targets
        target_data = []
        
        for grid_id in features_df['grid_id'].unique():
            grid_data = features_df[features_df['grid_id'] == grid_id].copy()
            grid_data = grid_data.sort_values('datetime')
            
            for i in range(len(grid_data) - 1):
                current_date = grid_data.iloc[i]['datetime']
                future_date = current_date + timedelta(days=window_days)
                
                # Check if there are fires in the next window_days
                future_fires = grid_data[
                    (grid_data['datetime'] > current_date) & 
                    (grid_data['datetime'] <= future_date)
                ]
                
                target_data.append({
                    'grid_id': grid_id,
                    'datetime': current_date,
                    'future_fire_probability': min(len(future_fires) / window_days, 1.0)
                })
        
        return pd.DataFrame(target_data)
    
    def train_model(self, fires_data: List[Dict]) -> Dict:
        """Train the Random Forest model"""
        if len(fires_data) < 100:
            return {"error": "Insufficient data for training"}
        
        # Convert to DataFrame
        fires_df = pd.DataFrame(fires_data)
        
        # Prepare features
        features_df = self.prepare_features(fires_df)
        
        # Create targets
        targets_df = self.create_prediction_targets(features_df)
        
        if len(targets_df) < 50:
            return {"error": "Insufficient target data for training"}
        
        # Merge features with targets
        train_data = features_df.merge(targets_df, on=['grid_id'], how='inner')
        
        X = train_data[self.feature_columns]
        y = train_data['future_fire_probability']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Random Forest
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Save model
        self.save_model()
        
        return {
            "model_version": self.model_version,
            "mse": mse,
            "r2_score": r2,
            "feature_importance": dict(zip(self.feature_columns, self.model.feature_importances_))
        }
    
    def predict_fire_probability(self, lat: float, lon: float, prediction_days: int = 7) -> Dict:
        """Predict fire probability for a specific location"""
        if not self.model:
            self.load_model()
            
        if not self.model:
            return {"error": "Model not trained"}
        
        # Create feature vector for prediction
        current_date = datetime.now()
        features = {
            'latitude': lat,
            'longitude': lon,
            'month': current_date.month,
            'day_of_year': current_date.timetuple().tm_yday,
            'hour': current_date.hour,
            'brightness_normalized': 0.5,  # Default values
            'confidence_normalized': 0.7,
            'frp_normalized': 0.5,
            'historical_count': 1.0,
            'is_weekend': current_date.weekday() >= 5,
            'is_peak_season': current_date.month in [3, 4, 5, 10, 11, 12],
            'is_post_harvest': current_date.month in [4, 5, 11, 12]
        }
        
        # Convert to format expected by model
        X = np.array([[features[col] for col in self.feature_columns]])
        X_scaled = self.scaler.transform(X)
        
        # Make prediction
        probability = self.model.predict(X_scaled)[0]
        
        # Determine risk level
        if probability >= 0.7:
            risk_level = "HIGH"
        elif probability >= 0.4:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        return {
            "probability": float(probability),
            "risk_level": risk_level,
            "prediction_days": prediction_days,
            "model_version": self.model_version
        }
    
    def generate_grid_predictions(self, bounds: Dict, grid_size: float = 0.1) -> List[Dict]:
        """Generate predictions for a grid of locations"""
        predictions = []
        
        lat_min, lat_max = bounds['lat_min'], bounds['lat_max']
        lon_min, lon_max = bounds['lon_min'], bounds['lon_max']
        
        lat_points = np.arange(lat_min, lat_max + grid_size, grid_size)
        lon_points = np.arange(lon_min, lon_max + grid_size, grid_size)
        
        for lat in lat_points:
            for lon in lon_points:
                pred = self.predict_fire_probability(lat, lon)
                if 'error' not in pred and pred['probability'] >= 0.3:  # Only high confidence
                    predictions.append({
                        'latitude': lat,
                        'longitude': lon,
                        **pred
                    })
        
        return predictions
    
    def save_model(self):
        """Save trained model to disk"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'model_version': self.model_version
        }
        
        os.makedirs('models', exist_ok=True)
        with open('models/fire_prediction_model.pkl', 'wb') as f:
            pickle.dump(model_data, f)
    
    def load_model(self):
        """Load trained model from disk"""
        try:
            with open('models/fire_prediction_model.pkl', 'rb') as f:
                model_data = pickle.load(f)
                
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_columns = model_data['feature_columns']
            self.model_version = model_data['model_version']
            
            return True
        except FileNotFoundError:
            return False