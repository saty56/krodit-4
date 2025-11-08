/**
 * Service Worker for Background Notifications
 * Handles push notifications and scheduled reminders
 */

/**
 * Feature detection utilities
 * Note: Some features are checked at runtime since they may not be available at module load time
 */
const features = {
  hasClients: typeof self.clients !== 'undefined',
  hasClientsMatchAll: typeof self.clients !== 'undefined' && 
                      typeof self.clients.matchAll === 'function',
  hasClientsOpenWindow: typeof self.clients !== 'undefined' && 
                        typeof self.clients.openWindow === 'function',
  hasPeriodicSync: 'periodicsync' in self,
  hasNotificationActions: typeof Notification !== 'undefined' && 'actions' in Notification.prototype,
};

/**
 * Check if notifications are supported (runtime check)
 */
function hasNotifications() {
  return typeof self.registration !== 'undefined' && 
         self.registration && 
         typeof self.registration.showNotification === 'function';
}

// Log feature support in development (runtime check for notifications)
if (typeof console !== 'undefined' && console.log) {
  console.log('Service Worker features:', {
    ...features,
    hasNotifications: hasNotifications(),
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  if (features.hasClients && typeof self.clients.claim === 'function') {
    event.waitUntil(self.clients.claim());
  }
});

/**
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
  if (!hasNotifications()) {
    console.warn('Notifications API not supported in service worker');
    return;
  }

  try {
    const data = event.data?.json() || {};
    const title = data.title || 'Subscription Reminder';
    const options = {
      body: data.body || 'You have an upcoming billing date',
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'subscription-reminder',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
    };

    // Only add actions if supported
    if (features.hasNotificationActions && data.actions) {
      options.actions = data.actions;
    } else if (features.hasNotificationActions) {
      options.actions = [
        {
          action: 'view',
          title: 'View Subscription',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ];
    }

    event.waitUntil(
      self.registration.showNotification(title, options).catch((error) => {
        console.error('Error showing notification:', error);
      })
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  if (!event.notification) {
    return;
  }

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'view' || !action) {
    // Open the subscription page
    const urlToOpen = data?.url || '/subscriptions';
    
    if (!features.hasClientsMatchAll) {
      console.warn('Clients API not fully supported');
      return;
    }

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If a window is already open, focus it
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client && 'focus' in client && typeof client.focus === 'function') {
              try {
                // Check if the URL matches (loose match - same origin)
                const clientUrl = new URL(client.url);
                const targetUrl = new URL(urlToOpen, self.location.origin);
                if (clientUrl.origin === targetUrl.origin) {
                  return client.focus();
                }
              } catch (e) {
                // If URL parsing fails, try direct comparison
                if (client.url.includes(urlToOpen)) {
                  return client.focus();
                }
              }
            }
          }
          
          // Otherwise, open a new window
          if (features.hasClientsOpenWindow) {
            return self.clients.openWindow(urlToOpen);
          } else {
            console.warn('Cannot open window: clients.openWindow not supported');
          }
        })
        .catch((error) => {
          console.error('Error handling notification click:', error);
        })
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    event.notification.close();
  }
});

/**
 * Periodic background sync for checking reminders
 */
if (features.hasPeriodicSync) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-reminders') {
      event.waitUntil(checkReminders());
    }
  });
}

/**
 * Check for reminders in the background
 */
async function checkReminders() {
  try {
    // This would need to be called from the main app
    // For now, we'll rely on scheduled notifications
    return Promise.resolve();
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

