const {
  REACT_APP_SENTRY_DSN: SENTRY_DSN,
  NODE_ENV,
} = process.env;

export const config = {
  SENTRY_DSN,
  NODE_ENV,
};
