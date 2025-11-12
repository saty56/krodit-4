/* Krodit Service Worker for background notifications */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ----------------------
// Simple per-day counter in SW (IndexedDB)
// ----------------------
const DB_NAME = 'reminderNotifications';
const STORE = 'swDaily';

function getLocalDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadCounts() {
  try {
    const db = await openDb();
    const tx = db.transaction([STORE], 'readonly');
    const store = tx.objectStore(STORE);
    const key = getLocalDayKey();
    const getReq = store.get(key);
    const value = await new Promise((resolve, reject) => {
      getReq.onsuccess = () => resolve(getReq.result || {});
      getReq.onerror = () => reject(getReq.error);
    });
    db.close?.();
    return value || {};
  } catch {
    return {};
  }
}

async function saveCounts(counts) {
  try {
    const db = await openDb();
    const tx = db.transaction([STORE], 'readwrite');
    const store = tx.objectStore(STORE);
    const key = getLocalDayKey();
    store.put(counts, key);
    db.close?.();
  } catch {}
}

async function canShowDailyReminder(subscriptionId, limit = 2) {
  if (!subscriptionId) return true;
  const counts = await loadCounts();
  const current = counts[subscriptionId] || 0;
  return current < limit;
}

async function recordDailyReminderShown(subscriptionId) {
  if (!subscriptionId) return;
  const counts = await loadCounts();
  counts[subscriptionId] = (counts[subscriptionId] || 0) + 1;
  await saveCounts(counts);
}

// ----------------------
// Push handler
// ----------------------
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    try { payload = JSON.parse(event.data.text()); } catch {}
  }

  const title = payload.title || 'Reminder';
  const body = payload.body || '';
  const tag = payload.tag || undefined;
  const data = payload.data || {};

  const promise = (async () => {
    const subId = data.subscriptionId;
    // Enforce per-device daily cap
    if (subId) {
      const allowed = await canShowDailyReminder(subId, 2);
      if (!allowed) return;
    }

    await self.registration.showNotification(title, {
      body,
      tag,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      requireInteraction: true,
      data,
    });

    if (subId) {
      await recordDailyReminderShown(subId);
    }
  })();

  event.waitUntil(promise);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url;
  const promise = (async () => {
    if (url) {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          client.focus();
          client.postMessage?.({ type: 'REMINDER_CLICKED' });
          break;
        }
      }
      await self.clients.openWindow(url);
    }
  })();
  event.waitUntil(promise);
});

self.addEventListener('notificationclose', (event) => {
  // No audio to stop here (SW cannot play audio); page code handles stopping when visible
});
