import React from 'react';
import { Button, Typography, List, Card, Space } from 'antd';
import { CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const features = [
  {
    title: 'Visual Cron Builder',
    description: 'Create and edit cron jobs without memorizing syntax'
  },
  {
    title: 'Preset Schedules',
    description: 'Quick templates for common frequencies (hourly, daily, weekly, etc.)'
  },
  {
    title: 'Real-time Validation',
    description: 'See your cron expression and validate it before saving'
  },
  {
    title: 'Local & Secure',
    description: 'All changes are saved directly to your local crontab'
  }
];

function Placeholder({ onCreate }) {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        background: 'var(--bg)'
      }}
    >
      <Card
        style={{
          maxWidth: '600px',
          width: '100%',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ margin: 0, color: 'var(--text)' }}>
              Welcome to Macron
            </Title>
            <Paragraph style={{ marginTop: '8px', marginBottom: 0, color: 'var(--muted)' }}>
              A modern GUI for managing your macOS crontab
            </Paragraph>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Text strong style={{ color: 'var(--text)', fontSize: '16px' }}>
              Features:
            </Text>
            <List
              dataSource={features}
              renderItem={item => (
                <List.Item
                  style={{
                    border: 'none',
                    padding: '12px 0',
                    color: 'var(--text)'
                  }}
                >
                  <Space>
                    <CheckCircleOutlined style={{ color: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                        {item.title}
                      </div>
                      <Text type="secondary" style={{ fontSize: '13px' }}>
                        {item.description}
                      </Text>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button
              onClick={onCreate}
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              style={{ minWidth: '200px' }}
            >
              Create Your First Job
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default Placeholder;
