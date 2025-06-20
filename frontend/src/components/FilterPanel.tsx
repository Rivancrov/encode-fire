import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  DatePicker,
  Select,
  Slider,
  Button,
  Space,
  Row,
  Col,
  Radio,
  InputNumber,
  Divider,
  Tag,
} from 'antd';
import { ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { FilterState } from '../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface FilterPanelProps {
  onFiltersChange: (filters: FilterState) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  onFiltersChange,
  onRefresh,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<FilterState>({
    sources: ['MODIS_C6_1', 'VIIRS_SNPP_C2', 'VIIRS_NOAA20_C2'],
    minConfidence: 50,
    region: {
      type: 'all',
    },
    bounds: {
      lat_min: 20,
      lat_max: 32,
      lon_min: 78,
      lon_max: 88,
    },
  });

  const sourceOptions = [
    { value: 'MODIS_C6_1', label: 'MODIS Collection 6.1', color: '#ff4d4f' },
    { value: 'VIIRS_SNPP_C2', label: 'VIIRS SNPP Collection 2', color: '#ff7a00' },
    { value: 'VIIRS_NOAA20_C2', label: 'VIIRS NOAA-20 Collection 2', color: '#fa8c16' },
    { value: 'USER_REPORTED', label: 'User Reported', color: '#1890ff' },
  ];

  const stateOptions = [
    'Punjab',
    'Haryana',
    'Uttar Pradesh',
    'Uttarakhand',
    'Himachal Pradesh',
    'Rajasthan',
    'Delhi',
    'Bihar',
  ];

  const cityOptions = [
    'New Delhi',
    'Chandigarh',
    'Lucknow',
    'Jaipur',
    'Amritsar',
    'Ludhiana',
    'Gurgaon',
    'Noida',
  ];

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
      }));
    }
  };

  const handleSourcesChange = (values: string[]) => {
    setFilters(prev => ({
      ...prev,
      sources: values,
    }));
  };

  const handleConfidenceChange = (value: number) => {
    setFilters(prev => ({
      ...prev,
      minConfidence: value,
    }));
  };

  const handleRegionTypeChange = (e: any) => {
    setFilters(prev => ({
      ...prev,
      region: {
        ...prev.region,
        type: e.target.value,
        value: undefined,
        radius: undefined,
      },
    }));
  };

  const handleRegionValueChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      region: {
        ...prev.region,
        value: value,
      },
    }));
  };

  const handleRadiusChange = (value: number | null) => {
    setFilters(prev => ({
      ...prev,
      region: {
        ...prev.region,
        radius: value || 50,
      },
    }));
  };

  const handleCustomBoundsChange = (field: string, value: number | null) => {
    if (value !== null) {
      setFilters(prev => ({
        ...prev,
        bounds: {
          ...prev.bounds,
          [field]: value,
        },
      }));
    }
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      sources: ['MODIS_C6_1', 'VIIRS_SNPP_C2', 'VIIRS_NOAA20_C2'],
      minConfidence: 50,
      region: {
        type: 'all',
      },
      bounds: {
        lat_min: 20,
        lat_max: 32,
        lon_min: 78,
        lon_max: 88,
      },
    };
    setFilters(defaultFilters);
    form.resetFields();
  };

  return (
    <Card 
      title={
        <Space>
          <FilterOutlined />
          Fire Detection Filters
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Form form={form} layout="vertical" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Date Range">
              <RangePicker
                style={{ width: '100%' }}
                onChange={handleDateRangeChange}
                placeholder={['Start Date', 'End Date']}
                defaultValue={[
                  dayjs().subtract(7, 'days'),
                  dayjs(),
                ]}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item label="Data Sources">
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Select data sources"
                value={filters.sources}
                onChange={handleSourcesChange}
                maxTagCount={2}
              >
                {sourceOptions.map(source => (
                  <Option key={source.value} value={source.value}>
                    <Space>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: source.color,
                          display: 'inline-block',
                        }}
                      />
                      {source.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={`Minimum Confidence: ${filters.minConfidence}%`}>
              <Slider
                min={0}
                max={100}
                value={filters.minConfidence}
                onChange={handleConfidenceChange}
                marks={{
                  0: '0%',
                  50: '50%',
                  80: '80%',
                  100: '100%',
                }}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item label="Region Filter">
              <Radio.Group
                value={filters.region.type}
                onChange={handleRegionTypeChange}
              >
                <Radio.Button value="all">All Northern India</Radio.Button>
                <Radio.Button value="state">By State</Radio.Button>
                <Radio.Button value="city">By City</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        {filters.region.type === 'state' && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Select State">
                <Select
                  style={{ width: '100%' }}
                  placeholder="Choose a state"
                  value={filters.region.value}
                  onChange={handleRegionValueChange}
                >
                  {stateOptions.map(state => (
                    <Option key={state} value={state}>
                      {state}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        {filters.region.type === 'city' && (
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item label="Select City">
                <Select
                  style={{ width: '100%' }}
                  placeholder="Choose a city"
                  value={filters.region.value}
                  onChange={handleRegionValueChange}
                  showSearch
                >
                  {cityOptions.map(city => (
                    <Option key={city} value={city}>
                      {city}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Radius (km)">
                <InputNumber
                  min={10}
                  max={200}
                  value={filters.region.radius || 50}
                  onChange={handleRadiusChange}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Divider>Advanced Bounds</Divider>
        
        <Row gutter={8}>
          <Col span={6}>
            <Form.Item label="Min Lat">
              <InputNumber
                min={15}
                max={35}
                step={0.1}
                value={filters.bounds.lat_min}
                onChange={(value) => handleCustomBoundsChange('lat_min', value)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Max Lat">
              <InputNumber
                min={15}
                max={35}
                step={0.1}
                value={filters.bounds.lat_max}
                onChange={(value) => handleCustomBoundsChange('lat_max', value)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Min Lon">
              <InputNumber
                min={70}
                max={95}
                step={0.1}
                value={filters.bounds.lon_min}
                onChange={(value) => handleCustomBoundsChange('lon_min', value)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Max Lon">
              <InputNumber
                min={70}
                max={95}
                step={0.1}
                value={filters.bounds.lon_max}
                onChange={(value) => handleCustomBoundsChange('lon_max', value)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="space-between" style={{ marginTop: 16 }}>
          <Col>
            <Space>
              <Button onClick={resetFilters}>Reset Filters</Button>
              <div>
                {filters.sources.map(source => {
                  const sourceInfo = sourceOptions.find(s => s.value === source);
                  return (
                    <Tag key={source} color={sourceInfo?.color}>
                      {sourceInfo?.label.split(' ')[0]}
                    </Tag>
                  );
                })}
              </div>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
            >
              Refresh Data
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default FilterPanel;