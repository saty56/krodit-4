/**
 * Reminder Service
 * Handles billing date reminders for subscriptions
 * Sends reminders one day before and on the same day as billing date
 */

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * Get subscriptions that need reminders
 * Returns subscriptions with billing dates:
 * - One day from now (reminder one day before)
 * - Today (reminder on the same day)
 */
export async function getSubscriptionsNeedingReminders(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // One day from now
  
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999); // End of today
  
  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999); // End of tomorrow

  // Get subscriptions with billing dates today or tomorrow
  const subscriptionsNeedingReminders = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.isActive, true),
        sql`${subscriptions.nextBillingDate} IS NOT NULL`,
        // Billing date is today or tomorrow
        gte(subscriptions.nextBillingDate, today),
        lte(subscriptions.nextBillingDate, endOfTomorrow)
      )
    );

  return subscriptionsNeedingReminders;
}

/**
 * Check if a subscription needs a reminder today
 * Returns reminder type: 'today' | 'tomorrow' | null
 */
export function getReminderType(billingDate: Date | string | null): 'today' | 'tomorrow' | null {
  if (!billingDate) return null;

  const billing = typeof billingDate === 'string' ? new Date(billingDate) : billingDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const billingDateOnly = new Date(billing);
  billingDateOnly.setHours(0, 0, 0, 0);

  // Check if billing date is today
  if (billingDateOnly.getTime() === today.getTime()) {
    return 'today';
  }

  // Check if billing date is tomorrow
  if (billingDateOnly.getTime() === tomorrow.getTime()) {
    return 'tomorrow';
  }

  return null;
}

/**
 * Format reminder message for a subscription
 */
export function formatReminderMessage(
  subscriptionName: string,
  amount: string,
  currency: string,
  billingDate: Date | string,
  reminderType: 'today' | 'tomorrow'
): string {
  const date = typeof billingDate === 'string' ? new Date(billingDate) : billingDate;
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedAmount = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
  }).format(parseFloat(amount));

  if (reminderType === 'today') {
    return `💰 ${subscriptionName} billing is due today (${formattedDate}) - ${formattedAmount}`;
  } else {
    return `⏰ ${subscriptionName} billing is due tomorrow (${formattedDate}) - ${formattedAmount}`;
  }
}

/**
 * Get all reminders for a user
 * Returns array of reminder objects with subscription info and reminder type
 */
export async function getUserReminders(userId: string) {
  const subscriptions = await getSubscriptionsNeedingReminders(userId);
  
  const reminders = subscriptions
    .map((sub) => {
      const reminderType = getReminderType(sub.nextBillingDate);
      if (!reminderType) return null;

      return {
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        amount: sub.amount,
        currency: sub.currency,
        billingDate: sub.nextBillingDate,
        reminderType,
        message: formatReminderMessage(
          sub.name,
          sub.amount,
          sub.currency,
          sub.nextBillingDate!,
          reminderType
        ),
      };
    })
    .filter((reminder): reminder is NonNullable<typeof reminder> => reminder !== null);

  return reminders;
}

