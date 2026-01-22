import { Button, Menu, Tooltip, Input, Space, Typography, Empty, Badge } from 'antd';
import { BulbOutlined, MoonOutlined, PlusOutlined, SearchOutlined, ClockCircleOutlined } from '@ant-design/icons';
import React, { useState, useMemo } from 'react';
import { formatNextRunTime, getFrequencyBadge } from '../utils/cron';
import { Job } from '../types/job';

const { Text } = Typography;

type SidebarProps = {
  jobs: Job[];
  onSelectionChange: (payload: { keys: string[]; lastKey?: string }) => void;
  onCreate: () => void;
  onToggleTheme: () => void;
  theme: string;
  selectedKeys: string[];
};

function Sidebar({
  jobs,
  onSelectionChange,
  onCreate,
  onToggleTheme,
  theme,
  selectedKeys
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const query = searchQuery.toLowerCase();
    return jobs.filter(job => 
      job.name.toLowerCase().includes(query) ||
      job.job?.command()?.toLowerCase().includes(query)
    );
  }, [jobs, searchQuery]);

  const handleSelect = ({ selectedKeys: keys, key }) => {
    onSelectionChange({ keys, lastKey: key });
  };

  const handleDeselect = ({ selectedKeys: keys, key }) => {
    onSelectionChange({ keys, lastKey: key });
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--panel)',
        borderRight: '1px solid var(--border)'
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: '16px', color: 'var(--text)' }}>
              Cron Jobs
            </Text>
            <Tooltip title="Toggle theme">
              <Button
                shape="circle"
                icon={theme === 'dark' ? <BulbOutlined /> : <MoonOutlined />}
                onClick={onToggleTheme}
                size="small"
              />
            </Tooltip>
          </div>
          
          <Button
            onClick={onCreate}
            type="primary"
            icon={<PlusOutlined />}
            block
            size="large"
          >
            Create Job
          </Button>

          {jobs.length > 0 && (
            <Input
              placeholder="Search jobs..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              allowClear
              bordered={false}
            />
          )}
        </Space>
      </div>

      {/* Jobs List */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {filteredJobs.length === 0 && jobs.length > 0 ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Empty
              description="No jobs found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ margin: '24px 0' }}
            />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Empty
              description="No cron jobs yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ margin: '24px 0' }}
            />
            <Button
              onClick={onCreate}
              type="primary"
              icon={<PlusOutlined />}
            >
              Create Your First Job
            </Button>
          </div>
        ) : (
          <Menu
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            mode="inline"
            selectable
            selectedKeys={selectedKeys}
            style={{ border: 'none', background: 'transparent' }}
          >
            {filteredJobs.map(job => {
              const cronExpression = job.job ?
                `${job.job.minute()} ${job.job.hour()} ${job.job.dom()} ${job.job.month()} ${job.job.dow()}` :
                null;
              const frequencyBadge = cronExpression ? getFrequencyBadge(cronExpression) : null;
              const nextRun = cronExpression ? formatNextRunTime(cronExpression) : null;

              return (
                <Menu.Item
                  key={job.key}
                  style={{
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    height: 'auto',
                    minHeight: '56px',
                    lineHeight: '1.5'
                  }}
                >
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                        {job.name}
                      </span>
                      {frequencyBadge && (
                        <Badge
                          status={frequencyBadge.type}
                          text={frequencyBadge.text}
                          style={{ fontSize: '11px' }}
                        />
                      )}
                    </div>
                    {job.job?.command() && (
                      <Text
                        type="secondary"
                        ellipsis
                        style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}
                        title={job.job.command()}
                      >
                        {job.job.command()}
                      </Text>
                    )}
                    {nextRun && (
                      <Text
                        type="secondary"
                        style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ClockCircleOutlined style={{ fontSize: '10px' }} />
                        Next run: {nextRun}
                      </Text>
                    )}
                  </div>
                </Menu.Item>
              );
            })}
          </Menu>
        )}
      </div>

      {/* Footer */}
      {jobs.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--panel)'
          }}
        >
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            {searchQuery && filteredJobs.length !== jobs.length && (
              <span> • {filteredJobs.length} shown</span>
            )}
          </Text>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
