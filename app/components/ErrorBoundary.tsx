// ABOUTME: React error boundary component for graceful error handling
// ABOUTME: Catches errors in child components and displays a fallback UI

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--bg)',
            padding: '20px'
          }}
        >
          <Result
            status="error"
            title="Something went wrong"
            subTitle="The application encountered an unexpected error. Please try reloading."
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReset}>
                Reload Application
              </Button>
            ]}
            style={{
              background: 'var(--panel)',
              borderRadius: '8px',
              padding: '40px',
              maxWidth: '600px'
            }}
          >
            {this.state.error && (
              <div style={{ marginTop: '16px', textAlign: 'left' }}>
                <details style={{ cursor: 'pointer' }}>
                  <summary style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    Error details
                  </summary>
                  <pre
                    style={{
                      background: 'var(--bg)',
                      padding: '12px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
