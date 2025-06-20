import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Typography, Space } from 'antd';
import {
  FireOutlined,
  LineChartOutlined,
  BookOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import FireDetectionPage from './pages/FireDetectionPage';
import FirePredictionPage from './pages/FirePredictionPage';
import EducationPage from './pages/EducationPage';
import 'antd/dist/reset.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [selectedKey, setSelectedKey] = React.useState('detection');

  const menuItems = [
    {
      key: 'detection',
      icon: <FireOutlined />,
      label: 'Fire Detection',
      path: '/detection',
    },
    {
      key: 'prediction',
      icon: <LineChartOutlined />,
      label: 'Fire Prediction',
      path: '/prediction',
    },
    {
      key: 'education',
      icon: <BookOutlined />,
      label: 'Impact Education',
      path: '/education',
    },
  ];

  const handleMenuClick = (e: any) => {
    setSelectedKey(e.key);
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#001529', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Space>
            <FireOutlined style={{ color: '#ff4d4f', fontSize: '24px' }} />
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              Fire Detection & Prediction System
            </Title>
          </Space>
          <Space style={{ color: 'white' }}>
            <DashboardOutlined />
            Northern India Stubble Burning Monitor
          </Space>
        </Header>
        
        <Layout>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            theme="light"
            width={250}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              onClick={handleMenuClick}
              items={menuItems.map(item => ({
                key: item.key,
                icon: item.icon,
                label: (
                  <span
                    onClick={() => window.history.pushState(null, '', item.path)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item.label}
                  </span>
                ),
              }))}
              style={{ height: '100%', borderRight: 0 }}
            />
          </Sider>
          
          <Layout style={{ padding: 0 }}>
            <Content style={{ 
              margin: 0, 
              minHeight: 280,
              background: '#f0f2f5',
              overflow: 'auto'
            }}>
              <Routes>
                <Route path="/" element={<Navigate to="/detection" replace />} />
                <Route path="/detection" element={<FireDetectionPage />} />
                <Route path="/prediction" element={<FirePredictionPage />} />
                <Route path="/education" element={<EducationPage />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;