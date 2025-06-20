import axios from 'axios';
import { FireDetection, FirePrediction, UserFireReport, ChatMessage } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fireDetectionAPI = {
  // Fire Detection endpoints
  refreshFireData: async (params: {
    sources?: string[];
    start_date?: string;
    end_date?: string;
    region?: string;
  }) => {
    const response = await api.post('/refresh-fire-data', null, { params });
    return response.data;
  },

  getFireDetections: async (params: {
    start_date?: string;
    end_date?: string;
    sources?: string[];
    min_confidence?: number;
    lat_min?: number;
    lat_max?: number;
    lon_min?: number;
    lon_max?: number;
    limit?: number;
  }): Promise<FireDetection[]> => {
    const response = await api.get('/fire-detections', { params });
    return response.data;
  },

  getRecentFireDetections: async (limit: number = 3): Promise<FireDetection[]> => {
    const response = await api.get('/fire-detections/recent', { params: { limit } });
    return response.data;
  },

  // Fire Prediction endpoints
  trainModel: async () => {
    const response = await api.post('/train-model');
    return response.data;
  },

  generatePredictions: async (params: {
    lat_min?: number;
    lat_max?: number;
    lon_min?: number;
    lon_max?: number;
    grid_size?: number;
  }) => {
    const response = await api.post('/generate-predictions', null, { params });
    return response.data;
  },

  getFirePredictions: async (params: {
    risk_level?: string;
    min_probability?: number;
    lat_min?: number;
    lat_max?: number;
    lon_min?: number;
    lon_max?: number;
    limit?: number;
  }): Promise<FirePrediction[]> => {
    const response = await api.get('/fire-predictions', { params });
    return response.data;
  },

  // User Fire Reporting
  reportFire: async (fireReport: UserFireReport) => {
    const response = await api.post('/report-fire', fireReport);
    return response.data;
  },

  // Chat with Claude Agent
  chatWithAgent: async (message: string): Promise<ChatMessage> => {
    const response = await api.post('/chat', { message });
    return response.data;
  },

  // Statistics
  getFireStatistics: async (params: {
    time_period?: string;
    group_by?: string;
  }) => {
    const response = await api.get('/fire-statistics', { params });
    return response.data;
  },
};

export default api;