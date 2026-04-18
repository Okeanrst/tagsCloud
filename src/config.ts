const { VITE_SENTRY_DSN: SENTRY_DSN, VITE_RENDER_GIT_COMMIT } = import.meta.env;

// eslint-disable-next-line no-console
console.log('build commit:', VITE_RENDER_GIT_COMMIT);

export const config = {
  SENTRY_DSN,
  NODE_ENV: import.meta.env.MODE,
};
