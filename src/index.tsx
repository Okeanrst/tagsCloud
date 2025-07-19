import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from "@sentry/react";
import { App } from './App';
import reportWebVitals from './reportWebVitals';
import packageJson from '../package.json';
import { config } from './config';

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

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
