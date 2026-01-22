import React from 'react';
import { Card, Typography, Space } from 'antd';
import CronBuilder from './CronBuilder';

const { Title } = Typography;

function Editor({ job, onCancel, onSave, onDelete }) {
  return (
    <div className="flex flex-col p-8" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <main className="flex-grow">
        <Card
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={3} style={{ margin: 0, color: 'var(--text)' }}>
                {job.name || 'New Cron Job'}
              </Title>
              {job.key && (
                <Typography.Text type="secondary" style={{ fontSize: '13px' }}>
                  Editing existing job
                </Typography.Text>
              )}
            </div>
            <CronBuilder
              onSave={onSave}
              onCancel={onCancel}
              onDelete={onDelete}
              job={job}
            />
          </Space>
        </Card>
      </main>
    </div>
  );
}

export default Editor;
