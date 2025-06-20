import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Space,
  Spin,
  message,
  Modal,
  Form,
  InputNumber,
} from 'antd';
import {
  RobotOutlined,
  UserOutlined,
  SendOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { fireDetectionAPI } from '../services/api';

const { TextArea } = Input;
const { Text } = Typography;

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  onFireReport?: (report: any) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ onFireReport }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your fire detection assistant. I can help you with:\n\n• Getting fire detection information\n• Understanding fire predictions\n• Reporting new fire sightings\n• Analyzing fire statistics\n\nWhat would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFireReportModalVisible, setIsFireReportModalVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [form] = Form.useForm();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'user' | 'bot', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    addMessage('user', userMessage);

    setLoading(true);
    try {
      const response = await fireDetectionAPI.chatWithAgent(userMessage);
      addMessage('bot', response.response || 'I apologize, I encountered an error processing your request.');
      
      // Check if the response suggests reporting a fire
      if (response.response && (response.response.toLowerCase().includes('report a fire') || 
          response.response.toLowerCase().includes('report fire') ||
          userMessage.toLowerCase().includes('report fire'))) {
        setTimeout(() => {
          setIsFireReportModalVisible(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('bot', 'I apologize, I encountered an error processing your request. Please try again.');
      message.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFireReport = async (values: any) => {
    try {
      const fireReport = {
        latitude: values.latitude,
        longitude: values.longitude,
        description: values.description || '',
        reporter_name: values.reporter_name || '',
        reporter_contact: values.reporter_contact || '',
      };

      const response = await fireDetectionAPI.reportFire(fireReport);
      
      if (response.status === 'success') {
        message.success('Fire reported successfully! Thank you for the report.');
        addMessage('bot', `Fire reported successfully at coordinates ${values.latitude}, ${values.longitude}. Fire ID: ${response.fire_id}. Thank you for helping keep our community safe!`);
        
        if (onFireReport) {
          onFireReport(fireReport);
        }
      }
      
      setIsFireReportModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Fire report error:', error);
      message.error('Failed to report fire. Please try again.');
    }
  };

  const quickQuestions = [
    'Show me recent fire detections',
    'What areas have high fire risk?',
    'How many fires were detected this week?',
    'I want to report a fire',
    'Explain fire confidence levels',
  ];

  const handleQuickQuestion = (question: string) => {
    setCurrentMessage(question);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            Fire Detection Assistant
          </Space>
        }
        size="small"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 16,
            maxHeight: '400px',
          }}
        >
          <List
            dataSource={messages}
            renderItem={(item) => (
              <List.Item style={{ border: 'none', padding: '8px 0' }}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={item.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                      style={{
                        backgroundColor: item.type === 'user' ? '#52c41a' : '#1890ff',
                      }}
                    />
                  }
                  title={
                    <Text strong>
                      {item.type === 'user' ? 'You' : 'Assistant'}
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                        {item.timestamp.toLocaleTimeString()}
                      </Text>
                    </Text>
                  }
                  description={
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                      {item.content}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          {loading && (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Spin size="small" />
              <Text type="secondary" style={{ marginLeft: 8 }}>
                Assistant is thinking...
              </Text>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>Quick questions:</Text>
          <div style={{ marginTop: 4 }}>
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                size="small"
                type="text"
                onClick={() => handleQuickQuestion(question)}
                style={{ 
                  margin: '2px 4px 2px 0', 
                  fontSize: '11px',
                  height: 'auto',
                  padding: '2px 6px',
                }}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about fires, predictions, or report a fire..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              loading={loading}
              disabled={!currentMessage.trim()}
            />
          </Space.Compact>
        </div>
      </Card>

      {/* Fire Report Modal */}
      <Modal
        title={
          <Space>
            <FireOutlined style={{ color: '#ff4d4f' }} />
            Report a Fire
          </Space>
        }
        open={isFireReportModalVisible}
        onCancel={() => {
          setIsFireReportModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFireReport}
        >
          <Form.Item
            name="latitude"
            label="Latitude"
            rules={[
              { required: true, message: 'Please enter latitude' },
              { type: 'number', min: 15, max: 35, message: 'Latitude must be between 15 and 35' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="e.g., 28.6139"
              step={0.0001}
              precision={4}
            />
          </Form.Item>

          <Form.Item
            name="longitude"
            label="Longitude"
            rules={[
              { required: true, message: 'Please enter longitude' },
              { type: 'number', min: 70, max: 95, message: 'Longitude must be between 70 and 95' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="e.g., 77.2090"
              step={0.0001}
              precision={4}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="Describe what you observed (smoke, flames, size, etc.)"
            />
          </Form.Item>

          <Form.Item
            name="reporter_name"
            label="Your Name (Optional)"
          >
            <Input placeholder="Your name" />
          </Form.Item>

          <Form.Item
            name="reporter_contact"
            label="Contact Information (Optional)"
          >
            <Input placeholder="Phone or email" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsFireReportModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" icon={<FireOutlined />}>
                Report Fire
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChatBot;