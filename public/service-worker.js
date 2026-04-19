self.addEventListener('install', () => {
  // eslint-disable-next-line no-console -- SW lifecycle logging for debugging installs
  console.log('service worker installed');
});

self.addEventListener('activate', () => {
  // eslint-disable-next-line no-console -- SW lifecycle logging for debugging installs
  console.log('service worker activated');
});

self.addEventListener('fetch', () => {
  // An empty fetch handler is sufficient to meet the PWA installability criteria.
});
