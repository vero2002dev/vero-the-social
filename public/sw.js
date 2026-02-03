const CACHE_NAME = 'vero-cache-v2';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([OFFLINE_URL, '/icon-192x192.png']);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(OFFLINE_URL);
            })
        );
    }
});

// =================================================================
// WEB PUSH NOTIFICATIONS
// =================================================================

self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'VERO', body: event.data.text() };
        }
    }

    const title = data.title || 'New Activity on VERO';
    const options = {
        body: data.message || data.body || 'Something happened!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: {
            url: data.url || '/app/notifications'
        },
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'View' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'close') return;

    // Open the app or focus existing window
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function (clientList) {
            // If window exists, focus it
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open new
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
