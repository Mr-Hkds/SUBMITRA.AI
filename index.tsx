import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: ''
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected startup error.'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Uncaught app error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('autoform_ai_draft_v1');
    } catch (e) {
      console.warn('[AppErrorBoundary] Failed to clear draft cache:', e);
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617',
        color: '#e2e8f0',
        padding: '24px',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          maxWidth: 620,
          width: '100%',
          border: '1px solid rgba(148,163,184,0.25)',
          borderRadius: 16,
          padding: 24,
          background: 'rgba(15,23,42,0.75)'
        }}>
          <p style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#34d399', margin: '0 0 8px' }}>
            Recovery Mode
          </p>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, color: '#f8fafc' }}>
            The app hit an unexpected startup error.
          </h1>
          <p style={{ margin: '0 0 18px', color: '#94a3b8', lineHeight: 1.5 }}>
            We prevented a blank screen. You can reload safely, or clear local draft cache and restart.
          </p>
          <pre style={{
            margin: '0 0 18px',
            padding: 12,
            borderRadius: 10,
            background: 'rgba(2,6,23,0.8)',
            border: '1px solid rgba(148,163,184,0.2)',
            overflow: 'auto',
            fontSize: 12,
            color: '#cbd5e1'
          }}>{this.state.message}</pre>
          <button
            onClick={this.handleReset}
            style={{
              border: 0,
              borderRadius: 10,
              padding: '10px 14px',
              background: '#10b981',
              color: '#052e16',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Clear Draft Cache & Reload
          </button>
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
