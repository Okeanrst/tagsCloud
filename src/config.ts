const { REACT_APP_SENTRY_DSN: SENTRY_DSN, NODE_ENV, REACT_APP_RENDER_GIT_COMMIT } = process.env;

// eslint-disable-next-line no-console
console.log('build commit:', REACT_APP_RENDER_GIT_COMMIT);

export const config = {
  SENTRY_DSN,
  NODE_ENV,
};
