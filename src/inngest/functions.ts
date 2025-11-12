import JSONL from "jsonl-parse-stringify"

import { inngest } from "@/inngest/client";
import { SubscriptionCreated } from "@/modules/subscriptions/types";
import { db } from "@/db";
import { reminderLogs, subscriptions, user, pushSubscriptions } from "@/db/schema";
import { and, inArray, lt, sql, eq } from "drizzle-orm";
import { getAllRemindersWithUser, hasReminderBeenSent } from "@/lib/reminder-service";
import { addWeeks, addMonths, addYears, isBefore, startOfDay } from "date-fns";
import { sendWebPushNotification } from "@/lib/webpush";

// Transcript item type that references existing subscriptions
type TranscriptItem = SubscriptionCreated & {
  subscription_id: string;
};

export const subscriptionCreated = inngest.createFunction(
  { id: "subscription-created" },
  { event: "subscriptions/created" },
  async ({ event, step }) => {
     const response = await step.run("fetch-transcript", async () => {
        return fetch(event.data.transcriptUrl).then((res) => res.text());
    });
        const transcript = await step.run("parse-transcript", async () => {
        const parsed = JSONL.parse(response);
        // Handle both array and single object cases
        const items = Array.isArray(parsed) ? parsed : [parsed];
        return items as TranscriptItem[];
    });
    const transcriptWithSubscriptions = await step.run("add-subscriptions", async () => {
       const subscriptionIds = [
        ...new Set(transcript.map((item) => item.subscription_id).filter((id): id is string => !!id)),
       ];
       
       if (subscriptionIds.length === 0) {
         return transcript.map((item) => ({
           ...item,
           user: {
             name: "Unknown",
           }
         }));
       }

       // Fetch subscriptions from database
       const dbSubscriptions = await db
       .select().from(subscriptions)
       .where(inArray(subscriptions.id, subscriptionIds));

       // Extract unique user IDs from subscriptions
       const userIds = [
         ...new Set(dbSubscriptions.map((sub) => sub.userId)),
       ];

       // Fetch users from database
       const users = userIds.length > 0 ? await db
       .select().from(user)
       .where(inArray(user.id, userIds)) : [];

       // Create maps for quick lookup
       const subscriptionMap = new Map(dbSubscriptions.map((sub) => [sub.id, sub]));
       const userMap = new Map(users.map((u) => [u.id, u]));

      return transcript.map((item) => {
        const subscription = subscriptionMap.get(item.subscription_id);

         if (!subscription) {
          return {
            ...item,
            user: {
               name: "Unknown",
            }
         };
         }

         const subscriptionUser = userMap.get(subscription.userId);
         
         return {
            ...item,
            user: subscriptionUser ? {
               name: subscriptionUser.name,
               email: subscriptionUser.email,
            } : {
               name: "Unknown",
            }
         };
      });
    });
    
    return transcriptWithSubscriptions;
  },
);

// Runs hourly to send reminder notifications for billing dates today and tomorrow (push only)
export const sendBillingReminders = inngest.createFunction(
  { id: "send-billing-reminders" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    // Load all due reminders (today/tomorrow) with user info
    const due = await step.run("load-reminders", () => getAllRemindersWithUser());

    let pushSent = 0;
    let skippedAlreadySent = 0;
    let noSubscribers = 0;
    let pruned = 0;

    // Group reminders by user to fetch subscriptions in batches
    const byUser = new Map<string, typeof due>();
    for (const r of due) {
      if (!byUser.has(r.userId)) byUser.set(r.userId, [] as any);
      (byUser.get(r.userId) as any).push(r);
    }

    for (const [userId, items] of byUser.entries()) {
      // Load active push subscriptions for this user
      const subs = await step.run(`load-push-${userId}`, async () => {
        return db
          .select()
          .from(pushSubscriptions)
          .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.isActive, true)));
      });

      if (!subs || subs.length === 0) {
        noSubscribers += items.length;
        continue;
      }

      for (const r of items) {
        const already = await step.run(`check-log-${r.subscriptionId}-${r.reminderType}`, async () =>
          hasReminderBeenSent({
            subscriptionId: r.subscriptionId as string,
            userId: r.userId as string,
            reminderType: r.reminderType,
            billingDate: new Date(r.billingDate as Date),
            channel: 'push',
          })
        );
        if (already) {
          skippedAlreadySent++;
          continue;
        }

        // Send to all active endpoints; consider success if at least one succeeds
        let sentAny = false;
        for (const endpoint of subs) {
          const payload = {
            title: r.message as string,
            body: undefined,
            tag: `reminder-${r.subscriptionId}-${r.reminderType}`,
            data: {
              subscriptionId: r.subscriptionId,
              reminderType: r.reminderType,
              priority: r.reminderType,
              url: `/subscriptions/${r.subscriptionId}`,
            },
          } as const;

          const result = await step.run(`push-${r.subscriptionId}-${endpoint.id}`, async () =>
            sendWebPushNotification(
              { endpoint: endpoint.endpoint, keys: { p256dh: endpoint.p256dh, auth: endpoint.auth } },
              payload
            )
          );

          if ((result as any).sent) {
            sentAny = true;
          } else if ((result as any).status === 404 || (result as any).status === 410) {
            // Prune dead subscription
            await step.run(`prune-${endpoint.id}`, async () => {
              await db
                .update(pushSubscriptions)
                .set({ isActive: false })
                .where(eq(pushSubscriptions.id, endpoint.id));
              pruned++;
            });
          }
        }

        if (sentAny) {
          pushSent++;
          // Log idempotency for push channel
          await step.run(`log-${r.subscriptionId}-${r.reminderType}`, async () => {
            const dateOnly = new Date(r.billingDate as Date);
            dateOnly.setHours(0, 0, 0, 0);
            await db.insert(reminderLogs).values({
              userId: r.userId as string,
              subscriptionId: r.subscriptionId as string,
              reminderType: r.reminderType,
              billingDate: dateOnly,
              channel: 'push',
            });
          });
        }
      }
    }

    return { processed: due.length, pushSent, skippedAlreadySent, noSubscribers, pruned, email: "disabled" } as const;
  }
);

// Advances past-due nextBillingDate values into the future so reminders continue automatically
export const updatePastBillingDates = inngest.createFunction(
  { id: "update-past-billing-dates" },
  // run a few minutes after the hour to avoid clashing with reminder sender
  { cron: "5 * * * *" },
  async ({ step }) => {
    const todayStart = startOfDay(new Date());

    // Load active subscriptions with past nextBillingDate (not null)
    const pastDueSubs = await step.run("load-past-due", async () => {
      return db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.isActive, true),
            sql`${subscriptions.nextBillingDate} IS NOT NULL`,
            lt(subscriptions.nextBillingDate, todayStart)
          )
        );
    });

    let advanced = 0;
    let cleared = 0; // one-time cleared

    for (const sub of pastDueSubs) {
      await step.run(`advance-${sub.id}`, async () => {
        const cycle = (sub as any).billingCycle as string | null;
        const original = new Date(sub.nextBillingDate as Date);
        let next = new Date(original);

        // Cap iterations to avoid infinite loop on corrupt data
        let guards = 0;
        const maxIters = 520; // up to 10 years of weekly cycles

        if (cycle === "one_time") {
          // Clear nextBillingDate so it doesn't keep showing as past-due
          await db.update(subscriptions)
            .set({ nextBillingDate: null })
            .where(eq(subscriptions.id, sub.id));
          cleared++;
          return;
        }

        while (isBefore(next, todayStart) && guards < maxIters) {
          guards++;
          switch (cycle) {
            case "weekly":
              next = addWeeks(next, 1);
              break;
            case "monthly":
              next = addMonths(next, 1);
              break;
            case "yearly":
              next = addYears(next, 1);
              break;
            default:
              // default to monthly if unknown
              next = addMonths(next, 1);
              break;
          }
        }

        // If still somehow in the past (guard hit), push to today
        if (isBefore(next, todayStart)) {
          next = todayStart;
        }

        await db.update(subscriptions)
          .set({ nextBillingDate: next })
          .where(eq(subscriptions.id, sub.id));

        advanced++;
      });
    }

    return { scanned: pastDueSubs.length, advanced, cleared };
  }
);