import React, { useEffect, useState } from 'react';
import crontab from 'crontab';
import { v4 } from 'uuid';
import { message, Modal, Spin } from 'antd';
import Placeholder from './Placeholder';
import Sidebar from './Sidebar';
import Editor from './Editor';

import { applyTheme, getTheme } from '../utils/theme';
import { CRON_5_REGEX } from '../utils/cron';

window.api = null;

function App() {
  const [loaded, setLoaded] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [job, setJob] = useState(null);
  const [theme, setTheme] = useState(getTheme());
  const [selectedKeys, setSelectedKeys] = useState([]);

  const handleSave = onSuccess => {
    if (!window.api) {
      message.error('Crontab not connected');
      return;
    }
    api.save(err => {
      if (err) {
        const errorMsg = err.message || err.toString();

        if (errorMsg.includes('Operation not permitted') || errorMsg.includes('Permission denied')) {
          Modal.error({
            title: 'Permission Required',
            content: (
              <div>
                <p>Macron needs Full Disk Access permission to modify crontab.</p>
                <ol style={{ marginTop: '12px', paddingLeft: '20px' }}>
                  <li>Open System Settings</li>
                  <li>Go to Privacy & Security → Full Disk Access</li>
                  <li>Click the + button and add Electron or Terminal.app</li>
                  <li>Toggle the permission ON</li>
                  <li>Restart this app</li>
                </ol>
              </div>
            ),
            width: 500
          });
        } else {
          message.error(errorMsg);
        }
        connect().catch(() => {});
        return;
      }

      onSuccess?.();
    });
  };

  const makeJob = (j, key) => ({
    job: j,
    key,
    name: j.comment() || j.render()
  });

  const ensureUniqueName = (desiredName, currentJob) => {
    const baseName = (desiredName || '').trim() || 'Job';
    const existingNames = jobs
      .filter(j => j.job !== currentJob.job)
      .map(j => j.name);

    if (!existingNames.includes(baseName)) {
      return baseName;
    }

    let counter = 1;
    let candidate = '';

    do {
      candidate = `${baseName}-${counter}`;
      counter += 1;
    } while (existingNames.includes(candidate));

    return candidate;
  };

  const connect = (selected = null) => {
    return new Promise((resolve, reject) => {
      crontab.load((err, _api) => {
        if (err) {
          const errorMsg = err.message || err.toString();

          if (errorMsg.includes('Operation not permitted') || errorMsg.includes('Permission denied')) {
            Modal.error({
              title: 'Permission Required',
              content: (
                <div>
                  <p>Macron needs Full Disk Access permission to read crontab.</p>
                  <ol style={{ marginTop: '12px', paddingLeft: '20px' }}>
                    <li>Open System Settings</li>
                    <li>Go to Privacy & Security → Full Disk Access</li>
                    <li>Click the + button and add Electron or Terminal.app</li>
                    <li>Toggle the permission ON</li>
                    <li>Restart this app</li>
                  </ol>
                </div>
              ),
              width: 500
            });
          } else {
            message.error(errorMsg);
          }

          return reject(err);
        }

        window.api = _api;

        const js = api.jobs().map(j => makeJob(j, v4()));

        if (selected) {
          const active = js.find(j => j.name === selected.name);
          setJob(active);
        }

        setJobs(js);
        setLoaded(true);

        return resolve(js);
      });
    });
  };

  const onCreate = () => {
    if (job && !job.key) {
      return 'already an unsaved job.';
    }
    if (!window.api) {
      message.error('Crontab not connected');
      return;
    }

    const a = api.create('echo "hello world"', '* * * * *', 'hello world');
    const b = makeJob(a, null);
    return setJob(b);
  };

  const onCancel = () => {
    if (!window.api) {
      message.error('Crontab not connected');
      return;
    }
    api.reset();
    message.success('Changes cancelled.');
    setJob(null);
    connect().catch(() => {});
  };

  const onSave = (j, payload) => {
    if (!window.api) {
      message.error('Crontab not connected');
      return;
    }

    const schedule = [
      payload.minute,
      payload.hour,
      payload.day,
      payload.month,
      payload.weekday
    ].join(' ');

    if (!CRON_5_REGEX.test(schedule.trim())) {
      return message.error('Invalid cron');
    }

    const name = ensureUniqueName(payload.name, j);
    const newJob = api.create(payload.command, schedule, name);

    if (!newJob || !newJob.isValid()) {
      return message.error('Invalid cron syntax');
    }

    api.remove(j.job);

    return handleSave(() => {
      const x = makeJob(newJob);
      message.success(`${x.name} saved.`);
      connect(x).catch(() => {});
    });
  };

  const onDelete = React.useCallback(
    j => {
      const schedule = `${j.job.minute()} ${j.job.hour()} ${j.job.dom()} ${j.job.month()} ${j.job.dow()}`;
      Modal.confirm({
        title: `Delete "${j.name}"?`,
        content: (
          <div>
            <p>Are you sure you want to delete this job?</p>
            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--panel)', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Command:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '4px', wordBreak: 'break-all' }}>
                  {j.job.command()}
                </div>
              </div>
              <div>
                <strong>Schedule:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '4px' }}>
                  {schedule}
                </div>
              </div>
            </div>
          </div>
        ),
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk() {
          if (!window.api) {
            message.error('Crontab not connected');
            return;
          }
          api.remove(j.job);
          handleSave(() => {
            const remaining = selectedKeys.filter(k => k !== j.key);
            setSelectedKeys(remaining);
            setJob(null);
            connect().catch(() => {});
          });
        }
      });
    },
    [selectedKeys]
  );

  useEffect(() => {
    connect().catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onCreate();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search jobs..."]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  const onSelectionChange = ({ keys, lastKey }) => {
    const keyToSelect = lastKey || keys[keys.length - 1] || null;
    const nextJob = jobs.find(j => j.key === keyToSelect) || null;
    setSelectedKeys(keyToSelect ? [keyToSelect] : []);
    setJob(nextJob);
  };

  return (
    <Spin spinning={!loaded} tip="Loading crontab...">
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: 'var(--bg)'
        }}
      >
        <nav style={{ width: '320px', flexShrink: 0 }}>
          <Sidebar
            onCreate={onCreate}
            jobs={jobs}
            onSelectionChange={onSelectionChange}
            onToggleTheme={toggleTheme}
            theme={theme}
            selectedKeys={selectedKeys}
          />
        </nav>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {job ? (
            <Editor
              onCancel={onCancel}
              onSave={onSave}
              onDelete={onDelete}
              job={job}
            />
          ) : (
            <Placeholder onCreate={onCreate} />
          )}
        </div>
      </div>
    </Spin>
  );
}

export default App;
