/**
 * Hook for checking and displaying billing reminders
 * Checks for reminders on mount and displays toast notifications
 * Also schedules browser notifications that work outside the app
 */

"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import {
  requestNotificationPermission,
  registerServiceWorker,
  scheduleReminderNotifications,
  isNotificationSupported,
} from "@/lib/notification-service";

/**
 * Get stored reminder keys from sessionStorage
 */
function getShownReminders(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const stored = sessionStorage.getItem("shownReminders");
  return stored ? new Set(JSON.parse(stored)) : new Set();
}

/**
 * Mark a reminder as shown in sessionStorage
 */
function markReminderAsShown(reminderKey: string) {
  if (typeof window === "undefined") return;
  const shown = getShownReminders();
  shown.add(reminderKey);
  sessionStorage.setItem("shownReminders", JSON.stringify(Array.from(shown)));
}

/**
 * Generate a unique key for a reminder
 */
function getReminderKey(reminder: any): string {
  return `${reminder.subscriptionId}-${reminder.reminderType}-${reminder.billingDate}`;
}

/**
 * Hook to check and display billing reminders
 * Automatically shows toast notifications for upcoming billing dates
 * Prevents showing duplicate reminders in the same session
 */
export function useReminders() {
  const hasShownReminders = useRef(false);
  const hasInitializedNotifications = useRef(false);

  // Initialize notification service on mount
  useEffect(() => {
    if (hasInitializedNotifications.current) return;
    hasInitializedNotifications.current = true;

    const initializeNotifications = async () => {
      if (!isNotificationSupported()) {
        console.log("Notifications not supported in this browser");
        return;
      }

      // Register service worker for background notifications
      await registerServiceWorker();

      // Request notification permission
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        console.log("Notification permission granted");
      }
    };

    initializeNotifications();
  }, []);

  const { data: reminders } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const response = await fetch("/api/reminders");
      if (!response.ok) {
        throw new Error("Failed to fetch reminders");
      }
      const data = await response.json();
      return data.reminders || [];
    },
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
    refetchOnWindowFocus: true,
  });

  // Schedule browser notifications for reminders
  useEffect(() => {
    if (!reminders || reminders.length === 0) return;

    // Schedule browser notifications (works even when app is closed)
    scheduleReminderNotifications(reminders);
  }, [reminders]);

  // Show toast notifications
  useEffect(() => {
    if (!reminders || reminders.length === 0) return;

    const shownReminders = getShownReminders();
    const newReminders = reminders.filter((reminder: any) => {
      const key = getReminderKey(reminder);
      return !shownReminders.has(key);
    });

    if (newReminders.length === 0) return;

    // Show reminders as toast notifications with a small delay to prevent multiple at once
    newReminders.forEach((reminder: any, index: number) => {
      const isToday = reminder.reminderType === "today";
      const reminderKey = getReminderKey(reminder);
      
      // Stagger notifications slightly to avoid overlap
      setTimeout(() => {
        toast.info(reminder.message, {
          icon: <Bell className="h-4 w-4" />,
          duration: isToday ? 10000 : 8000, // Longer duration for today's reminders
          action: {
            label: "View",
            onClick: () => {
              window.location.href = `/subscriptions/${reminder.subscriptionId}`;
            },
          },
        });

        // Mark as shown immediately
        markReminderAsShown(reminderKey);
      }, index * 300); // 300ms delay between each notification
    });
  }, [reminders]);

  return {
    reminders: reminders || [],
    hasReminders: reminders && reminders.length > 0,
  };
}

