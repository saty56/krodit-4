import { z } from "zod";

export const subscriptionCategoryValues = [
  "entertainment",
  "professional",
  "software",
  "cloud_storage",
  "music",
  "video_streaming",
  "gaming",
  "news",
  "education",
  "health_fitness",
  "other",
] as const;

export const billingCycleValues = [
  "monthly",
  "yearly",
  "weekly",
  "one_time",
] as const;

export const subscriptionsInsertschema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  instructions: z.string().optional().default(""),
  category: z.enum(subscriptionCategoryValues).default("other"),
  amount: z
    .string()
    .min(1, { message: "Invalid amount" })
    .default("0.00"),
  currency: z
    .string()
    .min(3, { message: "3-letter code" })
    .max(3, { message: "3-letter code" })
    .transform((v) => v.toUpperCase())
    .default("USD"),
  billingCycle: z.enum(billingCycleValues).default("monthly"),
  nextBillingDate: z.string().min(1,{ message: "Next billing date is required" }).default(""),
  isActive: z.boolean().default(true),
  isAutoRenew: z.boolean().default(true),
});
