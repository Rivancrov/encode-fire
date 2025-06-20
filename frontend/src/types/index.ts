export interface FireDetection {
  id: number;
  latitude: number;
  longitude: number;
  confidence: number;
  brightness: number;
  scan?: number;
  track?: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument: string;
  source: string;
  frp?: number;
  daynight?: string;
  created_at?: string;
}

export interface FirePrediction {
  id: number;
  latitude: number;
  longitude: number;
  probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  prediction_date: string;
  model_version: string;
  created_at: string;
}

export interface UserFireReport {
  latitude: number;
  longitude: number;
  description?: string;
  reporter_name?: string;
  reporter_contact?: string;
}

export interface ChatMessage {
  message: string;
  response?: string;
  timestamp?: string;
}

export interface FilterState {
  startDate?: string;
  endDate?: string;
  sources: string[];
  minConfidence: number;
  region: {
    type: 'all' | 'state' | 'city';
    value?: string;
    radius?: number;
  };
  bounds: {
    lat_min: number;
    lat_max: number;
    lon_min: number;
    lon_max: number;
  };
}