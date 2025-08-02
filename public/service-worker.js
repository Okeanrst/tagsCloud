// eslint-disable-next-line no-restricted-globals
self.addEventListener('install', (event) => {
  console.log('service worker installed');
});

// eslint-disable-next-line no-restricted-globals
self.addEventListener('activate', (event) => {
  console.log('service worker activated');
});

// eslint-disable-next-line no-restricted-globals
self.addEventListener('fetch', (event) => {
  // An empty fetch handler is sufficient to meet the PWA installability criteria.
});
