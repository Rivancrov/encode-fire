import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { FireDetection, FirePrediction } from '../types';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different sources
const createFireIcon = (source: string, isDetection: boolean = true) => {
  let color = '#ff4d4f'; // Default red
  
  if (isDetection) {
    switch (source) {
      case 'MODIS':
      case 'MODIS_C6_1':
        color = '#ff4d4f'; // Red
        break;
      case 'VIIRS':
      case 'VIIRS_SNPP_C2':
      case 'VIIRS_NOAA20_C2':
        color = '#ff7a00'; // Orange
        break;
      case 'USER_REPORTED':
        color = '#1890ff'; // Blue
        break;
      default:
        color = '#722ed1'; // Purple for other sources
    }
  } else {
    // Prediction colors based on risk level
    switch (source) {
      case 'HIGH':
        color = '#ff4d4f';
        break;
      case 'MEDIUM':
        color = '#fa8c16';
        break;
      case 'LOW':
        color = '#fadb14';
        break;
      default:
        color = '#52c41a';
    }
  }

  return L.divIcon({
    className: 'custom-fire-marker',
    html: `<div style="
      background-color: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
      opacity: ${isDetection ? '1' : '0.7'};
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const createPredictionIcon = (riskLevel: string) => {
  let color = '#fadb14';
  let size = 8;
  
  switch (riskLevel) {
    case 'HIGH':
      color = '#ff4d4f';
      size = 12;
      break;
    case 'MEDIUM':
      color = '#fa8c16';
      size = 10;
      break;
    case 'LOW':
      color = '#fadb14';
      size = 8;
      break;
  }

  return L.divIcon({
    className: 'custom-prediction-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 1px solid white;
      opacity: 0.6;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

interface MapComponentProps {
  fireDetections?: FireDetection[];
  firePredictions?: FirePrediction[];
  onMapReady?: (map: L.Map) => void;
  showDetections?: boolean;
  showPredictions?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({
  fireDetections = [],
  firePredictions = [],
  onMapReady,
  showDetections = true,
  showPredictions = false,
}) => {

  // Northern India bounds
  const bounds = [
    [20, 78], // Southwest
    [32, 88], // Northeast
  ] as L.LatLngBoundsExpression;

  const center = [26, 83] as L.LatLngExpression; // Center of Northern India

  const MapEvents = () => {
    const mapInstance = useMap();
    
    useEffect(() => {
      if (onMapReady) {
        onMapReady(mapInstance);
      }
    }, [mapInstance]);

    return null;
  };

  const formatDateTime = (date: string, time: string) => {
    if (!time || time.length < 4) return `${date} (Time unknown)`;
    const hours = time.substring(0, 2);
    const minutes = time.substring(2, 4);
    return `${date} ${hours}:${minutes}`;
  };

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      minZoom={5}
      maxZoom={15}
    >
      <MapEvents />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Fire Detection Markers */}
      {showDetections && fireDetections.map((fire) => (
        <Marker
          key={`detection-${fire.id}`}
          position={[fire.latitude, fire.longitude]}
          icon={createFireIcon(fire.source, true)}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <h4>Fire Detection</h4>
              <p><strong>Source:</strong> {fire.source}</p>
              <p><strong>Satellite:</strong> {fire.satellite}</p>
              <p><strong>Instrument:</strong> {fire.instrument}</p>
              <p><strong>Date/Time:</strong> {formatDateTime(fire.acq_date, fire.acq_time)}</p>
              <p><strong>Coordinates:</strong> {fire.latitude.toFixed(4)}, {fire.longitude.toFixed(4)}</p>
              <p><strong>Confidence:</strong> {fire.confidence}%</p>
              <p><strong>Brightness:</strong> {fire.brightness}K</p>
              {fire.frp && <p><strong>Fire Power:</strong> {fire.frp} MW</p>}
              {fire.daynight && <p><strong>Day/Night:</strong> {fire.daynight}</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Fire Prediction Markers */}
      {showPredictions && firePredictions.map((prediction) => (
        <Marker
          key={`prediction-${prediction.id}`}
          position={[prediction.latitude, prediction.longitude]}
          icon={createPredictionIcon(prediction.risk_level)}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <h4>Fire Prediction</h4>
              <p><strong>Risk Level:</strong> {prediction.risk_level}</p>
              <p><strong>Probability:</strong> {(prediction.probability * 100).toFixed(1)}%</p>
              <p><strong>Coordinates:</strong> {prediction.latitude.toFixed(4)}, {prediction.longitude.toFixed(4)}</p>
              <p><strong>Prediction Date:</strong> {new Date(prediction.prediction_date).toLocaleDateString()}</p>
              <p><strong>Model Version:</strong> {prediction.model_version}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;