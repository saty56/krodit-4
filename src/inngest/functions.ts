import JSONL from "jsonl-parse-stringify"

import { inngest } from "@/inngest/client";
import { SubscriptionCreated } from "@/modules/subscriptions/types";
import { db } from "@/db";
import { subscriptions, user } from "@/db/schema";
import { inArray } from "drizzle-orm";

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