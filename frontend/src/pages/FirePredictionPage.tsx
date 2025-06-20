import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Select, 
  Slider, 
  Space, 
  Statistic, 
  message, 
  Spin, 
  Typography,
  Alert,
  Progress,
  Tag,
} from 'antd';
import { 
  LineChartOutlined, 
  RobotOutlined, 
  ReloadOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import MapComponent from '../components/MapComponent';
import ChatBot from '../components/ChatBot';
import { fireDetectionAPI } from '../services/api';
import { FirePrediction } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const FirePredictionPage: React.FC = () => {
  const [firePredictions, setFirePredictions] = useState<FirePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [modelTrained, setModelTrained] = useState(false);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [filters, setFilters] = useState({
    risk_level: '',
    min_probability: 0.3,
    prediction_days: 7,
  });

  const loadPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        risk_level: filters.risk_level || undefined,
        min_probability: filters.min_probability,
        lat_min: 20,
        lat_max: 32,
        lon_min: 78,
        lon_max: 88,
      };

      const predictions = await fireDetectionAPI.getFirePredictions(params);
      setFirePredictions(predictions);
    } catch (error) {
      console.error('Error loading predictions:', error);
      message.error('Failed to load fire predictions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const trainModel = async () => {
    setGenerating(true);
    try {
      const result = await fireDetectionAPI.trainModel();
      
      if (result.error) {
        message.error(result.error);
        return;
      }

      setModelMetrics(result);
      setModelTrained(true);
      message.success(`Model trained successfully! R² Score: ${(result.r2_score * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('Error training model:', error);
      message.error('Failed to train prediction model');
    } finally {
      setGenerating(false);
    }
  };

  const generatePredictions = async () => {
    setGenerating(true);
    try {
      const result = await fireDetectionAPI.generatePredictions({
        lat_min: 20,
        lat_max: 32,
        lon_min: 78,
        lon_max: 88,
        grid_size: 0.2,
      });

      if (result.status === 'success') {
        message.success(`Generated ${result.predictions_generated} fire predictions`);
        await loadPredictions();
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
      message.error('Failed to generate predictions');
    } finally {
      setGenerating(false);
    }
  };

  const handleRiskLevelChange = (value: string) => {
    setFilters(prev => ({ ...prev, risk_level: value }));
  };

  const handleProbabilityChange = (value: number) => {
    setFilters(prev => ({ ...prev, min_probability: value / 100 }));
  };

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  // Calculate statistics
  const riskStats = firePredictions.reduce((acc, pred) => {
    acc[pred.risk_level] = (acc[pred.risk_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highRiskCount = riskStats['HIGH'] || 0;
  const mediumRiskCount = riskStats['MEDIUM'] || 0;
  const lowRiskCount = riskStats['LOW'] || 0;
  const totalPredictions = firePredictions.length;

  const avgProbability = totalPredictions > 0 
    ? Math.round(firePredictions.reduce((sum, pred) => sum + pred.probability, 0) / totalPredictions * 100)
    : 0;


  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>
            <LineChartOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            Fire Prediction Map
          </Title>
          <Text type="secondary">
            Machine learning predictions for fire occurrence risk in the next 7 days
          </Text>
        </Col>

        {/* Model Status */}
        <Col span={24}>
          <Alert
            message="ML Model Status"
            description={
              <div>
                <p>
                  The prediction model uses Random Forest regression trained on historical fire data, 
                  weather patterns, and seasonal trends to predict areas at risk of fire occurrence.
                </p>
                {modelMetrics && (
                  <div>
                    <strong>Model Performance:</strong>
                    <ul>
                      <li>R² Score: {(modelMetrics.r2_score * 100).toFixed(1)}%</li>
                      <li>Mean Squared Error: {modelMetrics.mse.toFixed(4)}</li>
                      <li>Model Version: {modelMetrics.model_version}</li>
                    </ul>
                  </div>
                )}
              </div>
            }
            type="info"
            showIcon
            action={
              <Space>
                <Button size="small" onClick={trainModel} loading={generating}>
                  <RobotOutlined /> Train Model
                </Button>
                <Button 
                  size="small" 
                  type="primary" 
                  onClick={generatePredictions} 
                  loading={generating}
                  disabled={!modelTrained}
                >
                  <ReloadOutlined /> Generate Predictions
                </Button>
              </Space>
            }
          />
        </Col>

        {/* Filters and Controls */}
        <Col span={24}>
          <Card title="Prediction Filters" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Risk Level</Text>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Filter by risk level"
                    value={filters.risk_level}
                    onChange={handleRiskLevelChange}
                    allowClear
                  >
                    <Option value="HIGH">
                      <Space>
                        <WarningOutlined style={{ color: '#ff4d4f' }} />
                        High Risk
                      </Space>
                    </Option>
                    <Option value="MEDIUM">
                      <Space>
                        <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                        Medium Risk
                      </Space>
                    </Option>
                    <Option value="LOW">
                      <Space>
                        <CheckCircleOutlined style={{ color: '#fadb14' }} />
                        Low Risk
                      </Space>
                    </Option>
                  </Select>
                </Space>
              </Col>
              
              <Col span={16}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Minimum Probability: {(filters.min_probability * 100).toFixed(0)}%</Text>
                  <Slider
                    min={10}
                    max={90}
                    value={filters.min_probability * 100}
                    onChange={handleProbabilityChange}
                    marks={{
                      10: '10%',
                      30: '30%',
                      50: '50%',
                      70: '70%',
                      90: '90%',
                    }}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Statistics */}
        <Col span={24}>
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Total Predictions"
                  value={totalPredictions}
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="High Risk Areas"
                  value={highRiskCount}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Medium Risk Areas"
                  value={mediumRiskCount}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Avg Probability"
                  value={avgProbability}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Main Content */}
        <Col span={16}>
          <Card
            title="Fire Risk Prediction Map"
            style={{ height: '500px' }}
            bodyStyle={{ padding: 0, height: 'calc(100% - 57px)' }}
            extra={
              <Button size="small" onClick={loadPredictions} loading={loading}>
                <ReloadOutlined /> Refresh
              </Button>
            }
          >
            {loading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%' 
              }}>
                <Spin size="large" />
              </div>
            ) : (
              <MapComponent
                firePredictions={firePredictions}
                showDetections={false}
                showPredictions={true}
              />
            )}
          </Card>

          {/* Legend */}
          <Card title="Prediction Legend" size="small" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Space>
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#ff4d4f',
                    opacity: 0.7,
                  }} />
                  <Text>High Risk (≥70%)</Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#fa8c16',
                    opacity: 0.7,
                  }} />
                  <Text>Medium Risk (40-69%)</Text>
                </Space>
              </Col>
              <Col span={8}>
                <Space>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#fadb14',
                    opacity: 0.7,
                  }} />
                  <Text>Low Risk (30-39%)</Text>
                </Space>
              </Col>
            </Row>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                * Predictions are based on historical patterns, seasonal trends, and environmental factors
              </Text>
            </div>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col span={8}>
          {/* Risk Distribution */}
          <Card title="Risk Distribution" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>High Risk</Text>
                  <Text strong style={{ color: '#ff4d4f' }}>{highRiskCount}</Text>
                </div>
                <Progress 
                  percent={totalPredictions > 0 ? (highRiskCount / totalPredictions) * 100 : 0} 
                  strokeColor="#ff4d4f" 
                  size="small"
                />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>Medium Risk</Text>
                  <Text strong style={{ color: '#fa8c16' }}>{mediumRiskCount}</Text>
                </div>
                <Progress 
                  percent={totalPredictions > 0 ? (mediumRiskCount / totalPredictions) * 100 : 0} 
                  strokeColor="#fa8c16" 
                  size="small"
                />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>Low Risk</Text>
                  <Text strong style={{ color: '#fadb14' }}>{lowRiskCount}</Text>
                </div>
                <Progress 
                  percent={totalPredictions > 0 ? (lowRiskCount / totalPredictions) * 100 : 0} 
                  strokeColor="#fadb14" 
                  size="small"
                />
              </div>
            </Space>
          </Card>

          {/* Prediction Info */}
          <Card title="About Predictions" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size="small">
              <Text strong>Prediction Model Features:</Text>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li><Text type="secondary">Historical fire density</Text></li>
                <li><Text type="secondary">Seasonal patterns</Text></li>
                <li><Text type="secondary">Geographic location</Text></li>
                <li><Text type="secondary">Weather conditions</Text></li>
                <li><Text type="secondary">Crop harvest cycles</Text></li>
              </ul>
              
              <Text strong style={{ marginTop: 8 }}>Time Horizon:</Text>
              <div>
                <Tag color="blue">7 Days</Tag>
                <Text type="secondary">Next week forecast</Text>
              </div>
              
              <Text strong>Confidence Levels:</Text>
              <div>
                <Tag color="red">High: 70-100%</Tag>
                <Tag color="orange">Medium: 40-69%</Tag>
                <Tag color="yellow">Low: 30-39%</Tag>
              </div>
            </Space>
          </Card>

          {/* Chat Bot */}
          <div style={{ height: '300px' }}>
            <ChatBot />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default FirePredictionPage;