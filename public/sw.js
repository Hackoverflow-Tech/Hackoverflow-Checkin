// public/sw.js — HackOverflow Push Service Worker

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data = {};
  try   { data = event.data.json(); }
  catch { data = { title: 'HackOverflow', body: event.data.text() }; }

  const title   = data.title || 'HackOverflow 4.0';
  const options = {
    body:    data.body    || data.message || '',
    icon:    data.icon    || '/icon-192.png',
    badge:   data.badge   || '/icon-96.png',
    tag:     data.tag     || 'hackoverflow-alert',
    data:    { url: data.url || '/alerts' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/alerts';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        for (const client of clients) {
          if (client.url.includes(url) && 'focus' in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});