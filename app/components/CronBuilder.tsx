import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Input, Form, Radio, Button, Typography, Alert, Space, Tooltip } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, FolderOpenOutlined, WarningOutlined } from '@ant-design/icons';
import { getCronDescription, formatNextRunTime, CRON_5_REGEX } from '../utils/cron';
import * as remote from '@electron/remote';
import * as fs from 'fs';

const { Text, Paragraph } = Typography;

function CronBuilder({ job, onSave, onCancel, onDelete }) {
  const [command, setCommand] = useState(job.job.command());
  const [name, setName] = useState(job.job.comment());
  const [minute, setMinute] = useState(job.job.minute());
  const [hour, setHour] = useState(job.job.hour());
  const [day, setDay] = useState(job.job.dom());
  const [month, setMonth] = useState(job.job.month());
  const [weekday, setWeekday] = useState(job.job.dow());
  const [frequency, setFrequency] = useState(job.key ? 'custom' : 'minutely');

  const help = (preset: React.SetStateAction<string>) => {
    setFrequency(preset);

    switch (preset) {
      case 'minutely':
        setMinute('*');
        setHour('*');
        setDay('*');
        setMonth('*');
        setWeekday('*');
        break;
      case '15min':
        setMinute('*/15');
        setHour('*');
        setDay('*');
        setMonth('*');
        setWeekday('*');
        break;
      case 'hourly':
        setMinute('0');
        setHour('*');
        setDay('*');
        setMonth('*');
        setWeekday('*');
        break;
      case '6hours':
        setMinute('0');
        setHour('*/6');
        setDay('*');
        setMonth('*');
        setWeekday('*');
        break;
      case 'nightly':
        setMinute('0');
        setHour('0');
        setDay('*');
        setMonth('*');
        setWeekday('*');
        break;
      case 'weekdays':
        setMinute('0');
        setHour('0');
        setDay('*');
        setMonth('*');
        setWeekday('1-5');
        break;
      case 'weekly':
        setMinute('0');
        setHour('0');
        setDay('*');
        setMonth('*');
        setWeekday('1');
        break;
      case 'monthly':
        setMinute('0');
        setHour('0');
        setDay('1');
        setMonth('*');
        setWeekday('*');
        break;
      default:
        break;
    }
  };

  const save = () => {
    onSave(job, {
      command,
      name,
      minute,
      hour,
      day,
      month,
      weekday
    });
  };

  const cancel = () => onCancel();

  const remove = () => onDelete(job);

  const selectFile = async () => {
    const result = await remote.dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Select Script or Executable',
      buttonLabel: 'Select',
      filters: [
        { name: 'Scripts', extensions: ['sh', 'py', 'rb', 'js', 'pl'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      setCommand(result.filePaths[0]);
      if (frequency !== 'custom') {
        setFrequency('custom');
      }
    }
  };

  // Cron expression preview and validation
  const cronExpression = useMemo(() => {
    return [minute, hour, day, month, weekday].join(' ').trim();
  }, [minute, hour, day, month, weekday]);

  const isValidCron = useMemo(() => {
    if (!cronExpression) return false;
    return CRON_5_REGEX.test(cronExpression);
  }, [cronExpression]);

  const [commandValidation, setCommandValidation] = useState({ valid: true, warning: null });

  useEffect(() => {
    if (!command.trim()) {
      setCommandValidation({ valid: false, warning: null });
      return;
    }

    const firstPart = command.trim().split(/\s+/)[0];

    if (firstPart.startsWith('/') || firstPart.startsWith('~/') || firstPart.startsWith('./')) {
      const expandedPath = firstPart.replace(/^~/, process.env.HOME || '');
      const timer = setTimeout(() => {
        fs.stat(expandedPath, (err, stats) => {
          if (err) {
            setCommandValidation({ valid: false, warning: 'File does not exist' });
          } else if (stats.isFile() && (stats.mode & fs.constants.S_IXUSR) === 0) {
            setCommandValidation({ valid: true, warning: 'File exists but may not be executable' });
          } else {
            setCommandValidation({ valid: true, warning: null });
          }
        });
      }, 300);
      return () => clearTimeout(timer);
    }

    setCommandValidation({ valid: true, warning: null });
  }, [command]);

  const handleFieldChange = (field, value, setter) => {
    setter(value);
    if (frequency !== 'custom') {
      setFrequency('custom');
    }
  };

  useEffect(() => {
    setName(job.job.comment());
    setCommand(job.job.command());
    setMinute(job.job.minute());
    setHour(job.job.hour());
    setDay(job.job.dom());
    setMonth(job.job.month());
    setWeekday(job.job.dow());
    setFrequency(job.key ? 'custom' : 'minutely');
  }, [job]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isValidCron && command.trim()) {
          save();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isValidCron, command, minute, hour, day, month, weekday, name, job, onSave]);

  return (
    <Form layout="vertical" className="max-w-2xl" style={{ padding: '8px 0' }}>
      <Form.Item
        style={{ marginBottom: '12px' }}
        label={
          <Space>
            <span>Job Name</span>
            <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'normal' }}>
              (Optional comment for identification)
            </Text>
          </Space>
        }
      >
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., Daily Backup"
        />
      </Form.Item>

      <Form.Item
        style={{ marginBottom: '12px' }}
        label="Command"
        required
        help="The shell command to execute"
        validateStatus={!commandValidation.valid ? 'error' : commandValidation.warning ? 'warning' : undefined}
      >
        <Space.Compact style={{ width: '100%' }} direction="vertical">
          <Input.TextArea
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder="e.g., /usr/bin/backup.sh"
            rows={2}
            status={!commandValidation.valid ? 'error' : commandValidation.warning ? 'warning' : undefined}
          />
          {commandValidation.warning && (
            <Alert
              message={commandValidation.warning}
              type={!commandValidation.valid ? 'error' : 'warning'}
              showIcon
              icon={<WarningOutlined />}
              style={{ marginTop: '4px' }}
            />
          )}
          <Tooltip title="Select a script or executable file">
            <Button
              icon={<FolderOpenOutlined />}
              onClick={selectFile}
              block
              size="small"
            >
              Browse for Script
            </Button>
          </Tooltip>
        </Space.Compact>
      </Form.Item>

      <Form.Item label="Schedule" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '6px' }}>
          <Radio.Group
            value={frequency}
            onChange={e => help(e.target.value)}
            size="small"
            buttonStyle="solid"
            style={{ width: '100%', display: 'contents' }}
          >
            <Radio.Button value="minutely" style={{ textAlign: 'center', fontSize: '12px' }}>Every Min</Radio.Button>
            <Radio.Button value="15min" style={{ textAlign: 'center', fontSize: '12px' }}>Every 15m</Radio.Button>
            <Radio.Button value="hourly" style={{ textAlign: 'center', fontSize: '12px' }}>Hourly</Radio.Button>
            <Radio.Button value="6hours" style={{ textAlign: 'center', fontSize: '12px' }}>Every 6h</Radio.Button>
            <Radio.Button value="nightly" style={{ textAlign: 'center', fontSize: '12px' }}>Daily</Radio.Button>
            <Radio.Button value="weekdays" style={{ textAlign: 'center', fontSize: '12px' }}>Weekdays</Radio.Button>
            <Radio.Button value="weekly" style={{ textAlign: 'center', fontSize: '12px' }}>Weekly</Radio.Button>
            <Radio.Button value="monthly" style={{ textAlign: 'center', fontSize: '12px' }}>Monthly</Radio.Button>
            <Radio.Button value="custom" style={{ textAlign: 'center', fontSize: '12px' }}>Custom</Radio.Button>
          </Radio.Group>
        </div>
      </Form.Item>

      <Form.Item
        style={{ marginBottom: '12px' }}
        label={
          <Space>
            <span>Cron Expression</span>
            {frequency === 'custom' && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <InfoCircleOutlined /> Format: minute hour day month weekday
              </Text>
            )}
          </Space>
        }
      >
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Tooltip title="0-59, or * for every minute. Use */15 for every 15 minutes" placement="top">
              <Input
                value={minute}
                onChange={e => handleFieldChange('minute', e.target.value, setMinute)}
                placeholder="*"
                addonBefore="Minute"
              />
            </Tooltip>
            <Tooltip title="0-23, or * for every hour. Use */6 for every 6 hours" placement="top">
              <Input
                value={hour}
                onChange={e => handleFieldChange('hour', e.target.value, setHour)}
                placeholder="*"
                addonBefore="Hour"
              />
            </Tooltip>
            <Tooltip title="1-31, or * for every day. Day of month" placement="top">
              <Input
                value={day}
                onChange={e => handleFieldChange('day', e.target.value, setDay)}
                placeholder="*"
                addonBefore="Day"
              />
            </Tooltip>
            <Tooltip title="1-12, or * for every month" placement="top">
              <Input
                value={month}
                onChange={e => handleFieldChange('month', e.target.value, setMonth)}
                placeholder="*"
                addonBefore="Month"
              />
            </Tooltip>
            <Tooltip title="0-7 (0 and 7 are Sunday), or * for every day. Use 1-5 for weekdays" placement="top">
              <Input
                value={weekday}
                onChange={e => handleFieldChange('weekday', e.target.value, setWeekday)}
                placeholder="*"
                addonBefore="Weekday"
              />
            </Tooltip>
          </div>
          
          <div style={{ marginTop: '12px' }}>
            <Paragraph
              copyable={{ text: cronExpression }}
              style={{
                margin: 0,
                padding: '8px 12px',
                background: 'var(--panel)',
                borderRadius: '4px',
                border: `1px solid ${isValidCron ? 'var(--border)' : 'var(--danger)'}`,
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
            >
              <Text strong style={{ color: isValidCron ? 'var(--text)' : 'var(--danger)' }}>
                {cronExpression || '* * * * *'}
              </Text>
            </Paragraph>

            {isValidCron && cronExpression && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--panel)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text style={{ fontSize: '13px', color: 'var(--text)' }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '6px' }} />
                    {getCronDescription(cronExpression)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px', marginLeft: '20px' }}>
                    Next run: {formatNextRunTime(cronExpression)}
                  </Text>
                </Space>
              </div>
            )}

            {!isValidCron && frequency === 'custom' && cronExpression && (
              <Alert
                message="Invalid cron expression"
                type="error"
                showIcon
                style={{ marginTop: '8px' }}
              />
            )}
          </div>
        </div>
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, marginTop: '-8px' }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Tooltip title={!isValidCron ? 'Invalid cron expression' : !command.trim() ? 'Command is required' : 'Save job (Cmd+S)'}>
              <Button onClick={save} type="primary" size="small" disabled={!isValidCron || !command.trim()}>
                Save Job
              </Button>
            </Tooltip>
            <Tooltip title="Discard changes">
              <Button onClick={cancel} size="small">
                Cancel
              </Button>
            </Tooltip>
          </Space>
          {job.key && (
            <Tooltip title="Permanently delete this cron job">
              <Button onClick={remove} danger size="small">
                Delete Job
              </Button>
            </Tooltip>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
}

export default CronBuilder;
