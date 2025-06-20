import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, List, Typography, Tag, Space, Statistic, message, Spin } from 'antd';
import { FireOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import MapComponent from '../components/MapComponent';
import FilterPanel from '../components/FilterPanel';
import ChatBot from '../components/ChatBot';
import { fireDetectionAPI } from '../services/api';
import { FireDetection, FilterState } from '../types';

const { Title, Text } = Typography;

const FireDetectionPage: React.FC = () => {
  const [fireDetections, setFireDetections] = useState<FireDetection[]>([]);
  const [recentFires, setRecentFires] = useState<FireDetection[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sources: ['MODIS_C6_1', 'VIIRS_SNPP_C2', 'VIIRS_NOAA20_C2'],
    minConfidence: 50,
    region: { type: 'all' },
    bounds: { lat_min: 20, lat_max: 32, lon_min: 78, lon_max: 88 },
  });

  const loadFireDetections = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        start_date: filters.startDate,
        end_date: filters.endDate,
        sources: filters.sources,
        min_confidence: filters.minConfidence,
        lat_min: filters.bounds.lat_min,
        lat_max: filters.bounds.lat_max,
        lon_min: filters.bounds.lon_min,
        lon_max: filters.bounds.lon_max,
        limit: 1000,
      };

      const detections = await fireDetectionAPI.getFireDetections(params);
      setFireDetections(detections);
    } catch (error) {
      console.error('Error loading fire detections:', error);
      message.error('Failed to load fire detections');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadRecentFires = useCallback(async () => {
    try {
      const recent = await fireDetectionAPI.getRecentFireDetections(3);
      setRecentFires(recent);
    } catch (error) {
      console.error('Error loading recent fires:', error);
    }
  }, []);

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      // Refresh data from NASA FIRMS API
      const refreshParams = {
        sources: filters.sources,
        start_date: filters.startDate,
        end_date: filters.endDate,
      };

      const result = await fireDetectionAPI.refreshFireData(refreshParams);
      
      if (result.status === 'success') {
        message.success(`Data refreshed! Found ${result.new_fires} new fires out of ${result.total_fires} total.`);
        
        // Reload the displayed data
        await loadFireDetections();
        await loadRecentFires();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      message.error('Failed to refresh data from NASA FIRMS');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleFireReport = async () => {
    // Reload data when a new fire is reported
    await loadFireDetections();
    await loadRecentFires();
  };

  useEffect(() => {
    loadFireDetections();
  }, [loadFireDetections]);

  useEffect(() => {
    loadRecentFires();
    // Set up auto-refresh for recent fires every 30 seconds
    const interval = setInterval(loadRecentFires, 30000);
    return () => clearInterval(interval);
  }, [loadRecentFires]);

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'MODIS':
      case 'MODIS_C6_1':
        return '#ff4d4f';
      case 'VIIRS':
      case 'VIIRS_SNPP_C2':
      case 'VIIRS_NOAA20_C2':
        return '#ff7a00';
      case 'USER_REPORTED':
        return '#1890ff';
      default:
        return '#722ed1';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'MODIS_C6_1':
        return 'MODIS';
      case 'VIIRS_SNPP_C2':
        return 'VIIRS SNPP';
      case 'VIIRS_NOAA20_C2':
        return 'VIIRS NOAA-20';
      case 'USER_REPORTED':
        return 'User Report';
      default:
        return source;
    }
  };

  const formatDateTime = (date: string, time: string) => {
    if (!time || time.length < 4) return `${date}`;
    const hours = time.substring(0, 2);
    const minutes = time.substring(2, 4);
    return `${date} ${hours}:${minutes}`;
  };

  // Calculate statistics
  const sourceStats = fireDetections.reduce((acc, fire) => {
    acc[fire.source] = (acc[fire.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highConfidenceFires = fireDetections.filter(fire => fire.confidence >= 80).length;
  const avgConfidence = fireDetections.length > 0 
    ? Math.round(fireDetections.reduce((sum, fire) => sum + fire.confidence, 0) / fireDetections.length)
    : 0;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>
            <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            Fire Detection Map
          </Title>
        </Col>
        
        {/* Filters */}
        <Col span={24}>
          <FilterPanel
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefreshData}
            loading={refreshing}
          />
        </Col>

        {/* Statistics */}
        <Col span={24}>
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Total Fires"
                  value={fireDetections.length}
                  prefix={<FireOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="High Confidence"
                  value={highConfidenceFires}
                  suffix={`/ ${fireDetections.length}`}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Avg Confidence"
                  value={avgConfidence}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Data Sources"
                  value={Object.keys(sourceStats).length}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Main Content */}
        <Col span={16}>
          <Card
            title="Interactive Fire Map"
            style={{ height: '500px' }}
            bodyStyle={{ padding: 0, height: 'calc(100% - 57px)' }}
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
                fireDetections={fireDetections}
                showDetections={true}
                showPredictions={false}
              />
            )}
          </Card>

          {/* Legend */}
          <Card title="Map Legend" size="small" style={{ marginTop: 16 }}>
            <Space wrap>
              <Space>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#ff4d4f',
                  border: '2px solid white',
                }} />
                <Text>MODIS</Text>
              </Space>
              <Space>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#ff7a00',
                  border: '2px solid white',
                }} />
                <Text>VIIRS</Text>
              </Space>
              <Space>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#1890ff',
                  border: '2px solid white',
                }} />
                <Text>User Reported</Text>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col span={8}>
          {/* Recent Fires */}
          <Card 
            title={
              <Space>
                <ClockCircleOutlined />
                Recent Fire Detections
              </Space>
            }
            size="small"
            style={{ marginBottom: 16 }}
          >
            <List
              size="small"
              dataSource={recentFires}
              renderItem={(fire) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getSourceColor(fire.source),
                      }} />
                    }
                    title={
                      <Space>
                        <Text strong>{getSourceLabel(fire.source)}</Text>
                        <Tag color={fire.confidence >= 80 ? 'green' : fire.confidence >= 50 ? 'orange' : 'red'}>
                          {fire.confidence}%
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>
                          <EnvironmentOutlined style={{ marginRight: 4 }} />
                          {fire.latitude.toFixed(4)}, {fire.longitude.toFixed(4)}
                        </div>
                        <div>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {formatDateTime(fire.acq_date, fire.acq_time)}
                        </div>
                        {fire.brightness && (
                          <div>Brightness: {fire.brightness}K</div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Chat Bot */}
          <div style={{ height: '400px' }}>
            <ChatBot onFireReport={handleFireReport} />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default FireDetectionPage;