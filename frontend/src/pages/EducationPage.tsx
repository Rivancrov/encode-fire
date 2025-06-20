import React from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Statistic, 
  Progress, 
  Timeline,
  Divider,
  Space,
  Tag,
  Alert,
} from 'antd';
import { 
  BookOutlined,
  WarningOutlined,
  HeartOutlined,
  DollarOutlined,
  GlobalOutlined,
  TrophyOutlined,
  BankOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Title, Text, Paragraph } = Typography;

const EducationPage: React.FC = () => {
  // Sample data for charts
  const airQualityData = [
    { month: 'Sep', aqi: 95, fireActivity: 12 },
    { month: 'Oct', aqi: 145, fireActivity: 89 },
    { month: 'Nov', aqi: 178, fireActivity: 156 },
    { month: 'Dec', aqi: 134, fireActivity: 78 },
    { month: 'Jan', aqi: 98, fireActivity: 23 },
    { month: 'Feb', aqi: 87, fireActivity: 18 },
  ];

  const healthImpactData = [
    { name: 'Respiratory Issues', value: 45, color: '#ff4d4f' },
    { name: 'Cardiovascular Problems', value: 25, color: '#fa8c16' },
    { name: 'Eye Irritation', value: 15, color: '#fadb14' },
    { name: 'Skin Problems', value: 10, color: '#52c41a' },
    { name: 'Other', value: 5, color: '#1890ff' },
  ];

  const economicImpactData = [
    { category: 'Healthcare Costs', amount: 2500, color: '#ff4d4f' },
    { category: 'Agricultural Losses', amount: 1800, color: '#fa8c16' },
    { category: 'Transportation Delays', amount: 800, color: '#fadb14' },
    { category: 'Energy Consumption', amount: 600, color: '#52c41a' },
    { category: 'Tourism Impact', amount: 400, color: '#1890ff' },
  ];

  const alternativePractices = [
    {
      title: 'Happy Seeder Technology',
      description: 'Direct seeding without burning crop residue',
      benefits: ['Reduces air pollution', 'Saves time and money', 'Improves soil health'],
      adoption: 65,
    },
    {
      title: 'Crop Residue Management',
      description: 'Converting stubble into useful products',
      benefits: ['Creates additional income', 'Reduces waste', 'Supports circular economy'],
      adoption: 45,
    },
    {
      title: 'Mulching and Composting',
      description: 'Using crop residue as organic fertilizer',
      benefits: ['Enhances soil fertility', 'Reduces chemical fertilizer use', 'Improves water retention'],
      adoption: 38,
    },
    {
      title: 'Biomass Energy',
      description: 'Converting agricultural waste to energy',
      benefits: ['Generates clean energy', 'Reduces dependence on fossil fuels', 'Creates jobs'],
      adoption: 25,
    },
  ];

  const governmentInitiatives = [
    {
      title: 'Crop Residue Management Scheme',
      year: '2018',
      budget: '₹1,151 crores',
      description: 'Financial assistance for farmers to purchase modern equipment',
    },
    {
      title: 'Happy Seeder Subsidy',
      year: '2019',
      budget: '₹669 crores',
      description: 'Up to 80% subsidy on Happy Seeder machines',
    },
    {
      title: 'Pusa Decomposer',
      year: '2020',
      budget: '₹15 crores',
      description: 'Bio-decomposer for in-situ crop residue management',
    },
    {
      title: 'Air Quality Monitoring',
      year: '2021',
      budget: '₹290 crores',
      description: 'Enhanced monitoring and early warning systems',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>
            <BookOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            Stubble Burning Impact Education
          </Title>
          <Paragraph>
            Understanding the comprehensive impact of stubble burning on environment, health, and economy
          </Paragraph>
        </Col>

        {/* Key Statistics */}
        <Col span={24}>
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Air Quality Degradation"
                  value={45}
                  suffix="% increase in AQI"
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Health Impact"
                  value={2.3}
                  suffix="million affected"
                  prefix={<HeartOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Economic Loss"
                  value={6200}
                  suffix="crores annually"
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#fadb14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="CO2 Emissions"
                  value={149}
                  suffix="million tonnes"
                  prefix={<GlobalOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Environmental Impact */}
        <Col span={12}>
          <Card title="Air Quality Impact" size="small">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={airQualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="aqi" fill="#ff4d4f" name="Air Quality Index" />
                <Bar dataKey="fireActivity" fill="#fa8c16" name="Fire Activity" />
              </BarChart>
            </ResponsiveContainer>
            <Alert
              message="Peak Pollution Period"
              description="October-November shows highest air pollution levels correlating with stubble burning activity"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Health Impact Distribution" size="small">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={healthImpactData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {healthImpactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Alert
              message="Primary Health Concerns"
              description="Respiratory issues account for 45% of health problems caused by stubble burning"
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>

        {/* Economic Impact */}
        <Col span={24}>
          <Card title="Economic Impact Analysis" size="small">
            <Row gutter={16}>
              {economicImpactData.map((item) => (
                <Col span={4.8} key={item.category}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic
                      title={item.category}
                      value={item.amount}
                      suffix="Cr"
                      valueStyle={{ color: item.color, fontSize: '18px' }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Economic Impact Details:</Text>
              <ul>
                <li><Text>Healthcare costs increase by 40% during peak stubble burning season</Text></li>
                <li><Text>Agricultural productivity drops due to soil degradation</Text></li>
                <li><Text>Transportation sector faces delays and increased fuel consumption</Text></li>
                <li><Text>Energy consumption increases for air purification systems</Text></li>
                <li><Text>Tourism industry suffers due to poor air quality</Text></li>
              </ul>
            </Space>
          </Card>
        </Col>

        {/* Alternative Practices */}
        <Col span={24}>
          <Card title="Alternative Practices & Adoption Rates" size="small">
            <Row gutter={16}>
              {alternativePractices.map((practice, index) => (
                <Col span={6} key={index}>
                  <Card size="small" style={{ height: '100%' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Title level={5}>{practice.title}</Title>
                      <Text type="secondary">{practice.description}</Text>
                      
                      <div>
                        <Text strong>Benefits:</Text>
                        <ul style={{ margin: '8px 0', paddingLeft: 16 }}>
                          {practice.benefits.map((benefit, i) => (
                            <li key={i}><Text type="secondary">{benefit}</Text></li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <Text strong>Adoption Rate:</Text>
                        <Progress 
                          percent={practice.adoption} 
                          strokeColor={practice.adoption > 50 ? '#52c41a' : '#fa8c16'}
                          size="small"
                        />
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Government Initiatives */}
        <Col span={12}>
          <Card title="Government Initiatives" size="small">
            <Timeline
              items={governmentInitiatives.map((initiative) => ({
                dot: <BankOutlined style={{ color: '#1890ff' }} />,
                children: (
                  <div>
                    <Space direction="vertical" size="small">
                      <div>
                        <Text strong>{initiative.title}</Text>
                        <Tag color="blue" style={{ marginLeft: 8 }}>{initiative.year}</Tag>
                      </div>
                      <Text type="secondary">{initiative.description}</Text>
                      <Text strong style={{ color: '#52c41a' }}>Budget: {initiative.budget}</Text>
                    </Space>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        {/* Success Stories */}
        <Col span={12}>
          <Card title="Success Stories" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Space direction="vertical">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <TrophyOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    <Text strong>Punjab's Happy Seeder Success</Text>
                  </div>
                  <Text>
                    Punjab achieved 65% reduction in stubble burning through Happy Seeder technology, 
                    benefiting 45,000 farmers and improving air quality by 30%.
                  </Text>
                </Space>
              </Card>

              <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Space direction="vertical">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ExperimentOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    <Text strong>Haryana's Pusa Decomposer</Text>
                  </div>
                  <Text>
                    Haryana's pilot project with Pusa Decomposer covered 5,000 acres, 
                    reducing stubble burning by 80% and improving soil organic matter by 15%.
                  </Text>
                </Space>
              </Card>

              <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Space direction="vertical">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <GlobalOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    <Text strong>Uttar Pradesh's Biomass Plants</Text>
                  </div>
                  <Text>
                    UP established 15 biomass power plants, generating 150 MW clean energy 
                    and providing income to 25,000 farmers from crop residue sales.
                  </Text>
                </Space>
              </Card>
            </Space>
          </Card>
        </Col>

        {/* Environmental Benefits */}
        <Col span={24}>
          <Card title="Environmental Benefits of Alternative Practices" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Air Quality Improvement"
                    value={35}
                    suffix="% reduction in PM2.5"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Text type="secondary">During peak season</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Carbon Sequestration"
                    value={1.2}
                    suffix="tonnes CO2/hectare"
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Text type="secondary">Annual carbon capture</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Soil Health"
                    value={20}
                    suffix="% improvement"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                  <Text type="secondary">Organic matter increase</Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Call to Action */}
        <Col span={24}>
          <Alert
            message="Join the Movement Against Stubble Burning"
            description={
              <div>
                <Paragraph>
                  Everyone can contribute to reducing stubble burning impact:
                </Paragraph>
                <ul>
                  <li><Text>Farmers: Adopt alternative practices with government subsidies</Text></li>
                  <li><Text>Citizens: Support awareness campaigns and report stubble burning</Text></li>
                  <li><Text>Government: Implement and monitor effective policies</Text></li>
                  <li><Text>Industry: Invest in biomass utilization technologies</Text></li>
                </ul>
                <Text strong>Together, we can create cleaner air and healthier communities!</Text>
              </div>
            }
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default EducationPage;