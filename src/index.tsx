import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import packageJson from '../package.json';
import { App } from './App';
import reportWebVitals from './reportWebVitals';
import { config } from './config';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

Sentry.init({
  dsn: config.SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  sendClientReports: config.NODE_ENV === 'production',
  environment: config.NODE_ENV,
  release: packageJson.version,
});

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element "#root" not found');
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

serviceWorkerRegistration.unregister();
