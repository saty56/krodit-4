import JSONL from "jsonl-parse-stringify"

import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { subscriptions, user } from "@/db/schema";
import { inArray } from "drizzle-orm";

// Transcript item type - records that reference subscriptions
type TranscriptItem = {
  subscription_id: string;
  [key: string]: unknown;
};

export const subscriptionCreated = inngest.createFunction(
  { id: "subscription-created" },
  { event: "subscriptions/created" },
  async ({ event, step }) => {
    const response = await step.run("fetch-transcript", async () => {
      return await step.fetch(event.data.transcriptUrl).then(response => response.text());
    });
    
    const transcript: TranscriptItem[] = await step.run("parse-transcript", async () => {
      const parsed = JSONL.parse(response);
      return Array.isArray(parsed) ? parsed as TranscriptItem[] : [parsed] as TranscriptItem[];
    });
    
    const transcriptWithSubscription = await step.run("add-subscription", async () => {
      // Extract unique subscription IDs from transcript
      const subscriptionIds: string[] = [
        ...new Set(transcript.map((item: TranscriptItem) => item.subscription_id).filter((id): id is string => !!id)),
      ];
      
      if (subscriptionIds.length === 0) {
        return transcript.map((item: TranscriptItem) => ({
          ...item,
          user: {
            name: "Unknown",
          }
        }));
      }

      // Fetch subscriptions from database
      const dbSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(inArray(subscriptions.id, subscriptionIds));

      // Extract unique user IDs from subscriptions
      const userIds = [
        ...new Set(dbSubscriptions.map(sub => sub.userId)),
      ];

      if (userIds.length === 0) {
        return transcript.map((item: TranscriptItem) => ({
          ...item,
          user: {
            name: "Unknown",
          }
        }));
      }

      // Fetch users from database
      const users = await db
        .select()
        .from(user)
        .where(inArray(user.id, userIds));

      // Create maps for quick lookup
      const subscriptionMap = new Map(dbSubscriptions.map(sub => [sub.id, sub]));
      const userMap = new Map(users.map(u => [u.id, u]));

      // Map transcript items with user information
      return transcript.map((item: TranscriptItem) => {
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
    
    return transcriptWithSubscription;
  },
);