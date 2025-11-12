import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

let configured = false;
export function initWebPush() {
  if (configured) return;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[webpush] Missing VAPID keys; push notifications will be skipped.");
    return;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
}

export type PushPayload = {
  title: string;
  body?: string;
  tag?: string;
  data?: Record<string, any>;
};

export async function sendWebPushNotification(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}, payload: PushPayload) {
  initWebPush();
  if (!configured) return { skipped: true } as const;

  const notifPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    tag: payload.tag,
    data: payload.data,
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      } as any,
      notifPayload
    );
    return { sent: true } as const;
  } catch (err: any) {
    const status = err?.statusCode || err?.status || 0;
    return { error: true, status } as const;
  }
}
