/**
 * Notification Service
 * Handles browser notifications for subscription reminders
 * Works even when the app is closed or browser tab is inactive
 */

// ----------------------
// Reminder sound support
// ----------------------
let audioCtx: AudioContext | null = null;
let audioPrimed = false;
const SOUND_STORAGE_KEY = "krodit:reminderSoundEnabled";

function getDefaultSoundEnabled(): boolean {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(SOUND_STORAGE_KEY) : null;
    if (saved === null) return true; // default on
    return saved === '1';
  } catch {
    return true;
  }
}

let reminderSoundEnabled = getDefaultSoundEnabled();

function primeAudioContext() {
  if (audioPrimed) return;
  try {
    // Some browsers need an explicit user gesture before creating/resuming
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    audioPrimed = true;
  } catch {
    // no-op
  }
}

function attachOneTimeGestureListeners() {
  if (typeof window === 'undefined') return;
  const handler = () => {
    primeAudioContext();
    window.removeEventListener('click', handler);
    window.removeEventListener('keydown', handler);
    window.removeEventListener('touchstart', handler, { capture: true } as any);
  };
  window.addEventListener('click', handler, { once: true } as any);
  window.addEventListener('keydown', handler, { once: true } as any);
  window.addEventListener('touchstart', handler, { once: true, passive: true } as any);
}

export function initReminderSound() {
  attachOneTimeGestureListeners();
}

export function setReminderSoundEnabled(enabled: boolean) {
  reminderSoundEnabled = enabled;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? '1' : '0');
  } catch {}
}

export function isReminderSoundEnabled() {
  return reminderSoundEnabled;
}

export function playReminderSound(options?: { priority?: 'today' | 'tomorrow' }) {
  if (typeof window === 'undefined') return;
  if (!reminderSoundEnabled) return;
  // Only play when page is visible to avoid background audio surprises
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

  primeAudioContext();
  if (!audioCtx) return;

  const ctx = audioCtx;
  const now = ctx.currentTime;

  // Simple two-tone chime; stronger for today
  const isToday = options?.priority === 'today';
  const volume = isToday ? 0.15 : 0.08;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.005);

  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.setValueAtTime(isToday ? 880 : 660, now);

  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(isToday ? 1320 : 990, now + 0.12);

  const master = ctx.createGain();
  master.gain.setValueAtTime(1, now);

  o1.connect(gain).connect(master).connect(ctx.destination);
  o2.connect(gain);

  // Envelope: quick attack/decay
  gain.gain.setTargetAtTime(0, now + 0.18, 0.08);

  o1.start(now);
  o2.start(now + 0.1);

  o1.stop(now + 0.5);
  o2.stop(now + 0.6);

  const cleanup = () => {
    try { o1.disconnect(); } catch {}
    try { o2.disconnect(); } catch {}
    try { gain.disconnect(); } catch {}
    try { master.disconnect(); } catch {}
  };
  o2.addEventListener?.('ended', cleanup as any);
  setTimeout(cleanup, 700);
}

// ----------------------
// Daily reminder limit (per subscription, per local day)
// ----------------------
const DAILY_LIMIT_PREFIX = "krodit:reminderDaily:v1:";

function getLocalDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${DAILY_LIMIT_PREFIX}${y}-${m}-${d}`;
}

function loadDailyCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const key = getLocalDayKey();
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveDailyCounts(counts: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    const key = getLocalDayKey();
    localStorage.setItem(key, JSON.stringify(counts));
  } catch {}
}

export function canShowDailyReminder(subscriptionId: string, limit = 2): boolean {
  if (!subscriptionId) return true;
  const counts = loadDailyCounts();
  const current = counts[subscriptionId] || 0;
  return current < limit;
}

export function recordDailyReminderShown(subscriptionId: string) {
  if (!subscriptionId) return;
  const counts = loadDailyCounts();
  counts[subscriptionId] = (counts[subscriptionId] || 0) + 1;
  saveDailyCounts(counts);
}

// ----------------------
// Long-running reminder alarm (loops the chime)
// ----------------------
let alarmInterval: ReturnType<typeof setInterval> | null = null;
let alarmStopTimeout: ReturnType<typeof setTimeout> | null = null;
let alarmActive = false;
let alarmUntil = 0; // epoch ms
let alarmMinMs = 60_000; // default 1 minute

export function setReminderAlarmMinSeconds(seconds: number) {
  alarmMinMs = Math.max(1, Math.floor(seconds)) * 1000;
}

export function stopReminderAlarm() {
  alarmActive = false;
  alarmUntil = 0;
  if (alarmInterval) {
    try { clearInterval(alarmInterval); } catch {}
    alarmInterval = null;
  }
  if (alarmStopTimeout) {
    try { clearTimeout(alarmStopTimeout); } catch {}
    alarmStopTimeout = null;
  }
}

export function startReminderAlarm(options?: { priority?: 'today' | 'tomorrow'; minSeconds?: number }) {
  if (typeof window === 'undefined') return;
  if (!reminderSoundEnabled) return;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

  // Ensure audio primed
  primeAudioContext();
  if (!audioCtx) return;

  const minMs = Math.max(alarmMinMs, (options?.minSeconds ?? 0) * 1000);
  const now = Date.now();

  // If already active, extend end time if needed
  if (alarmActive) {
    alarmUntil = Math.max(alarmUntil, now + minMs);
    return;
  }

  alarmActive = true;
  alarmUntil = now + minMs;

  // Play immediately
  try { playReminderSound({ priority: options?.priority }); } catch {}

  // Repeat every 3 seconds to feel continuous but not overwhelming
  alarmInterval = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const t = Date.now();
    if (t >= alarmUntil) {
      stopReminderAlarm();
      return;
    }
    try { playReminderSound({ priority: options?.priority }); } catch {}
  }, 3000);

  // Hard stop as a safety at alarmUntil
  alarmStopTimeout = setTimeout(() => {
    stopReminderAlarm();
  }, minMs);
}

// Track active notification timers by tag
// In browser, setTimeout returns a number; in Node.js it returns NodeJS.Timeout
const notificationTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Feature detection utilities
 * Checks for availability of browser APIs before using them
 */
const features = {
  hasNotification: typeof window !== 'undefined' && 'Notification' in window,
  hasServiceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  hasIndexedDB: typeof window !== 'undefined' && 'indexedDB' in window,
  hasPromise: typeof Promise !== 'undefined',
  hasSetTimeout: typeof setTimeout !== 'undefined',
  hasClearTimeout: typeof clearTimeout !== 'undefined',
  hasIntl: typeof Intl !== 'undefined',
};

/**
 * Format currency amount with feature detection and fallback
 */
function formatCurrencyAmount(amount: string, currency: string = 'USD'): string {
  if (features.hasIntl && typeof Intl.NumberFormat === 'function') {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency || 'USD',
      }).format(parseFloat(amount));
    } catch (error) {
      // Fallback if Intl.NumberFormat fails
      return `${currency || 'USD'} ${parseFloat(amount).toFixed(2)}`;
    }
  } else {
    return `${currency || 'USD'} ${parseFloat(amount).toFixed(2)}`;
  }
}

/**
 * Format date with feature detection and fallback
 */
function formatBillingDate(date: Date): string {
  try {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    // Fallback date formatting
    return date.toISOString().split('T')[0];
  }
}

/**
 * Generate notification title and body for a reminder
 */
function generateReminderNotification(
  subscriptionName: string,
  reminderType: 'today' | 'tomorrow',
  formattedDate: string,
  formattedAmount: string
): { title: string; body: string } {
  const title = reminderType === 'today'
    ? `💰 ${subscriptionName} billing due today!`
    : `⏰ ${subscriptionName} billing due tomorrow`;

  const body = `${subscriptionName} billing is due ${reminderType === 'today' ? 'today' : 'tomorrow'} (${formattedDate}) - ${formattedAmount}`;

  return { title, body };
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!features.hasNotification) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission has been denied');
      return false;
    }

    // Request permission
    if (typeof Notification.requestPermission === 'function') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } else {
      // Fallback for older browsers that return a string directly
      // This should not happen in modern browsers, but handle it gracefully
      console.warn('Notification.requestPermission is not a function');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Check if notifications are supported and permitted
 */
export function isNotificationSupported(): boolean {
  return features.hasNotification && typeof window !== 'undefined';
}

/**
 * Check if notification permission is granted
 */
export function hasNotificationPermission(): boolean {
  if (!features.hasNotification || typeof window === 'undefined') {
    return false;
  }
  
  try {
    return Notification.permission === 'granted';
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
}

/**
 * Register service worker for background notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!features.hasServiceWorker) {
    console.warn('Service workers are not supported');
    return null;
  }

  if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
    return null;
  }

  try {
    // Check if service worker registration is available
    if (typeof navigator.serviceWorker.register !== 'function') {
      console.warn('Service worker registration not available');
      return null;
    }

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    // If notifications already granted, ensure push subscription exists
    try {
      if (hasNotificationPermission()) {
        await subscribeToPush(registration);
      }
    } catch (e) {
      console.warn('Failed to subscribe to push after SW registration:', e);
    }

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// ----------------------
// Web Push subscription management
// ----------------------
const VAPID_PUBLIC_KEY = (typeof process !== 'undefined' ? (process as any).env?.NEXT_PUBLIC_VAPID_PUBLIC_KEY : undefined) || (globalThis as any).NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(registration?: ServiceWorkerRegistration) {
  try {
    if (!features.hasServiceWorker || !features.hasNotification) return null;
    const reg = registration || (await navigator.serviceWorker.ready);
    if (!reg.pushManager) return null;
    if (!VAPID_PUBLIC_KEY) {
      console.warn('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY; skipping push subscription');
      return null;
    }

    // Check existing
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const body = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: (sub as any).toJSON().keys.p256dh,
        auth: (sub as any).toJSON().keys.auth,
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return sub;
  } catch (e) {
    console.warn('subscribeToPush error:', e);
    return null;
  }
}

export async function unsubscribeFromPush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
    return true;
  } catch (e) {
    console.warn('unsubscribeFromPush error:', e);
    return false;
  }
}

/**
 * Store scheduled notification in IndexedDB for persistence
 */
async function storeScheduledNotification(
  id: string,
  title: string,
  options: NotificationOptions & { scheduleTime: number }
): Promise<void> {
  if (!features.hasIndexedDB || typeof window === 'undefined' || !window.indexedDB) {
    console.warn('IndexedDB not available, notification will not persist');
    return;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('reminderNotifications', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('notifications')) {
        db.close();
        const upgradeRequest = indexedDB.open('reminderNotifications', 2);
        upgradeRequest.onupgradeneeded = (event) => {
          const upgradeDb = (event.target as IDBOpenDBRequest).result;
          if (!upgradeDb.objectStoreNames.contains('notifications')) {
            upgradeDb.createObjectStore('notifications', { keyPath: 'id' });
          }
        };
        upgradeRequest.onsuccess = () => {
          const upgradeDb = upgradeRequest.result;
          const transaction = upgradeDb.transaction(['notifications'], 'readwrite');
          const store = transaction.objectStore('notifications');
          store.put({ id, title, options, scheduleTime: options.scheduleTime });
          resolve();
        };
        return;
      }

      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      store.put({ id, title, options, scheduleTime: options.scheduleTime });
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Remove scheduled notification from IndexedDB
 */
async function removeScheduledNotification(id: string): Promise<void> {
  if (!features.hasIndexedDB || typeof window === 'undefined' || !window.indexedDB) {
    return;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('reminderNotifications', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('notifications')) {
        resolve();
        return;
      }

      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Remove all scheduled notifications for a subscription from IndexedDB
 */
async function removeScheduledNotificationsByTag(tagPrefix: string): Promise<void> {
  if (!features.hasIndexedDB || typeof window === 'undefined' || !window.indexedDB) {
    return;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('reminderNotifications', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('notifications')) {
        resolve();
        return;
      }

      const transaction = db.transaction(['notifications'], 'readwrite');
      const store = transaction.objectStore('notifications');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const notifications = getAllRequest.result;
        const deletePromises = notifications
          .filter((notification: any) => {
            const notificationTag = notification.options?.tag || '';
            return notificationTag.startsWith(tagPrefix);
          })
          .map((notification: any) => {
            const deleteRequest = store.delete(notification.id);
            return new Promise<void>((resolveDelete, rejectDelete) => {
              deleteRequest.onsuccess = () => resolveDelete();
              deleteRequest.onerror = () => rejectDelete(deleteRequest.error);
            });
          });

        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Schedule a notification for a specific time
 * Uses setTimeout for immediate scheduling and IndexedDB for persistence
 */
export async function scheduleNotification(
  title: string,
  options: NotificationOptions & { scheduleTime?: number }
): Promise<void> {
  if (!hasNotificationPermission()) {
    console.warn('Notification permission not granted');
    return;
  }

  const { scheduleTime, ...notificationOptions } = options;

  if (scheduleTime) {
    const now = Date.now();
    const delay = scheduleTime - now;

    if (delay <= 0) {
      // Show immediately if time has passed
      showNotification(title, notificationOptions);
      return;
    }

    // Store in IndexedDB for persistence
    const notificationId = `${notificationOptions.tag || 'notification'}-${scheduleTime}`;
    await storeScheduledNotification(notificationId, title, {
      ...notificationOptions,
      scheduleTime,
    });

    // Schedule for later (works when tab is active)
    if (!features.hasSetTimeout) {
      console.warn('setTimeout not available, cannot schedule notification');
      return;
    }

    const timerId = setTimeout(() => {
      // Remove timer from tracking when it fires
      if (notificationOptions.tag) {
        notificationTimers.delete(notificationOptions.tag);
      }
      showNotification(title, notificationOptions);
    }, delay);

    // Track the timer so we can cancel it later
    if (notificationOptions.tag) {
      // Cancel any existing timer for this tag
      const existingTimer = notificationTimers.get(notificationOptions.tag);
      if (existingTimer && features.hasClearTimeout) {
        clearTimeout(existingTimer);
      }
      notificationTimers.set(notificationOptions.tag, timerId);
    }

    // Also notify service worker for background notifications
    if (features.hasServiceWorker && typeof navigator !== 'undefined' && navigator.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          // Enforce per-subscription daily limit for service worker notifications too
          try {
            const subId = (notificationOptions as any).data?.subscriptionId as string | undefined;
            if (subId && !canShowDailyReminder(subId)) {
              // Skip showing via SW if limit reached
            } else {
              registration.showNotification(title, {
                ...notificationOptions,
                requireInteraction: true,
              });
              if (subId) {
                try { recordDailyReminderShown(subId); } catch {}
              }
            }
          } catch {
            // Fallback to showing
            registration.showNotification(title, {
              ...notificationOptions,
              requireInteraction: true,
            });
          }
        }
      } catch (error) {
        console.warn('Error showing notification via service worker:', error);
      }
    }
  } else {
    // Show immediately
    showNotification(title, notificationOptions);
  }
}

/**
 * Show a notification immediately
 */
export function showNotification(
  title: string,
  options: NotificationOptions = {}
): Notification | null {
  if (!hasNotificationPermission()) {
    console.warn('Notification permission not granted');
    return null;
  }

  // Enforce per-subscription, per-local-day limit
  try {
    const subId = (options as any).data?.subscriptionId as string | undefined;
    if (subId && !canShowDailyReminder(subId)) {
      return null;
    }
  } catch {}
  const defaultOptions: NotificationOptions = {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    requireInteraction: false,
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);

    // Record show against daily limit if we have a subscriptionId
    try {
      const subId2 = (options as any).data?.subscriptionId as string | undefined;
      if (subId2) {
        recordDailyReminderShown(subId2);
      }
    } catch {}

    // Start a longer alarm for high-priority (today) reminders when shown from page context
    try {
      const priority = (options as any).data?.priority as 'today' | 'tomorrow' | undefined;
      if (priority === 'today') {
        startReminderAlarm({ priority: 'today', minSeconds: 60 });
      } else {
        // Fallback: short chime
        playReminderSound({ priority });
      }
    } catch {}

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      try { stopReminderAlarm(); } catch {}
      if ( (options as any).data?.url) {
        window.focus();
        window.location.href = (options as any).data.url;
      }
      notification.close();
    };

    // Stop alarm when the notification is closed by any means
    notification.onclose = () => {
      try { stopReminderAlarm(); } catch {}
    };

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

/**
 * Schedule reminders for subscriptions
 * Schedules notifications for 9 AM on the reminder day
 */
export async function scheduleReminderNotifications(
  reminders: Array<{
    subscriptionId: string;
    subscriptionName: string;
    amount: string;
    currency: string;
    billingDate: Date | string;
    reminderType: 'today' | 'tomorrow';
  }>
): Promise<void> {
  if (!hasNotificationPermission()) {
    return;
  }

  for (const reminder of reminders) {
    // Enforce per-subscription daily limit before scheduling/showing
    if (!canShowDailyReminder(reminder.subscriptionId)) {
      continue;
    }

    const billingDate = typeof reminder.billingDate === 'string'
      ? new Date(reminder.billingDate)
      : reminder.billingDate;

    const now = new Date();
    const reminderTime = new Date(billingDate);

    if (reminder.reminderType === 'tomorrow') {
      // Schedule for 9 AM tomorrow (one day before billing)
      reminderTime.setDate(reminderTime.getDate() - 1);
      reminderTime.setHours(9, 0, 0, 0);
    } else {
      // Schedule for 9 AM today (same day as billing)
      reminderTime.setHours(9, 0, 0, 0);
    }

    // Format amount and date once
    const formattedAmount = formatCurrencyAmount(reminder.amount, reminder.currency);
    const formattedDate = formatBillingDate(billingDate);
    const { title, body } = generateReminderNotification(
      reminder.subscriptionName,
      reminder.reminderType,
      formattedDate,
      formattedAmount
    );

    const notificationOptions = {
      body,
      tag: `reminder-${reminder.subscriptionId}-${reminder.reminderType}`,
      requireInteraction: reminder.reminderType === 'today',
      data: {
        url: `/subscriptions/${reminder.subscriptionId}`,
        subscriptionId: reminder.subscriptionId,
        priority: reminder.reminderType,
      },
    };

    // Only schedule if the time hasn't passed
    if (reminderTime.getTime() > now.getTime()) {
      await scheduleNotification(title, {
        ...notificationOptions,
        scheduleTime: reminderTime.getTime(),
      });
    } else {
      // If time has passed, show immediately
      showNotification(title, notificationOptions);
    }
  }
}

/**
 * Cancel scheduled notifications for a subscription
 * Cancels setTimeout timers, removes from IndexedDB, and closes displayed notifications
 */
export async function cancelReminderNotifications(subscriptionId: string): Promise<void> {
  const tagPrefix = `reminder-${subscriptionId}`;
  const todayTag = `${tagPrefix}-today`;
  const tomorrowTag = `${tagPrefix}-tomorrow`;

  try {
    // 1. Cancel setTimeout timers
    if (features.hasClearTimeout) {
      const todayTimer = notificationTimers.get(todayTag);
      if (todayTimer) {
        clearTimeout(todayTimer);
        notificationTimers.delete(todayTag);
      }

      const tomorrowTimer = notificationTimers.get(tomorrowTag);
      if (tomorrowTimer) {
        clearTimeout(tomorrowTimer);
        notificationTimers.delete(tomorrowTag);
      }
    }

    // 2. Remove from IndexedDB
    await removeScheduledNotificationsByTag(tagPrefix);

    // 3. Close displayed notifications (service worker and main thread)
    if (features.hasServiceWorker && typeof navigator !== 'undefined' && navigator.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if getNotifications is available
        if (registration && typeof registration.getNotifications === 'function') {
          // Close today notifications
          try {
            const todayNotifications = await registration.getNotifications({
              tag: todayTag,
            });
            todayNotifications.forEach((notification) => {
              if (notification && typeof notification.close === 'function') {
                notification.close();
              }
            });
          } catch (error) {
            console.warn('Error getting today notifications:', error);
          }

          // Close tomorrow notifications
          try {
            const tomorrowNotifications = await registration.getNotifications({
              tag: tomorrowTag,
            });
            tomorrowNotifications.forEach((notification) => {
              if (notification && typeof notification.close === 'function') {
                notification.close();
              }
            });
          } catch (error) {
            console.warn('Error getting tomorrow notifications:', error);
          }
        }
      } catch (swError) {
        console.warn('Error closing service worker notifications:', swError);
      }
    }

    // Also close any notifications in the main thread (if any)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Note: We can't directly query main thread notifications, but they'll be cleaned up
      // when the page reloads or when new notifications replace them
    }
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

