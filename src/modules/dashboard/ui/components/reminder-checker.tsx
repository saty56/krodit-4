/**
 * Reminder Checker Component
 * Client component that checks and displays billing reminders
 */

"use client";

import { useReminders } from "@/hooks/use-reminders";

/**
 * Component that checks for reminders and displays notifications
 * Should be placed in the dashboard layout
 */
export function ReminderChecker() {
  useReminders();
  return null; // This component doesn't render anything
}

