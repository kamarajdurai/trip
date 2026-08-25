import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './i18n/config'
import App from './App.jsx'

// Initialize Sentry only when DSN is configured
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions in dev/staging, tune to 0.2 in heavy production
    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample 10% of standard sessions
    replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with an error
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}><h2>Something went wrong.</h2><p>Our team has been automatically notified.</p><button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#810000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Reload Page</button></div>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

