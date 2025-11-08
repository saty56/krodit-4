import { z } from "zod";

/**
 * Subscription category values
 * All available categories for organizing subscriptions
 */
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

/**
 * Billing cycle values
 * All supported billing frequencies
 */
export const billingCycleValues = [
  "monthly",
  "yearly",
  "weekly",
  "one_time",
] as const;

/**
 * TypeScript types derived from the enums
 */
export type SubscriptionCategory = (typeof subscriptionCategoryValues)[number];
export type BillingCycle = (typeof billingCycleValues)[number];

/**
 * Common currency codes (ISO 4217)
 * Most frequently used currencies
 */
export const commonCurrencies = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "BRL"
] as const;

/**
 * Currency validation schema
 * Validates ISO 4217 currency codes (3 uppercase letters)
 * Accepts lowercase input and normalizes it to uppercase before validation
 */
const currencySchema = z.preprocess(
  (val) => (typeof val === "string" ? val.toUpperCase() : val),
  z
    .string()
    .min(3, { message: "Currency code must be 3 characters" })
    .max(3, { message: "Currency code must be 3 characters" })
    .regex(/^[A-Z]{3}$/, { message: "Currency code must be 3 uppercase letters" })
).default("USD");

/**
 * Amount validation schema
 * Validates monetary amounts as strings (for precision)
 */
const amountSchema = z
  .string()
  .min(1, { message: "Amount is required" })
  .regex(/^\d+(\.\d{1,2})?$/, { message: "Amount must be a valid number with up to 2 decimal places" })
  .refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    { message: "Amount must be a positive number" }
  )
  .default("0.00");

/**
 * Date string validation schema
 * Validates ISO date strings (YYYY-MM-DD format)
 */
const dateStringSchema = z
  .string()
  .min(1, { message: "Date is required" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" })
  .refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "Date must be a valid date" }
  );

/**
 * Optional date string schema
 * For fields where date is optional
 */
const optionalDateStringSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      return /^\d{4}-\d{2}-\d{2}$/.test(val);
    },
    { message: "Date must be in YYYY-MM-DD format" }
  );

/**
 * URL validation schema
 * Validates service URLs (optional)
 */
const urlSchema = z
  .string()
  .url({ message: "Must be a valid URL" })
  .optional()
  .or(z.literal(""));

/**
 * Subscription insert schema
 * Schema for creating a new subscription
 */
export const subscriptionsInsertschema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(200, { message: "Name must be less than 200 characters" })
    .trim(),
  
  instructions: z
    .string()
    .max(1000, { message: "Instructions must be less than 1000 characters" })
    .optional()
    .default(""),
  
  category: z
    .enum(subscriptionCategoryValues, {
      message: "Invalid category selected",
    })
    .default("other"),
  
  amount: amountSchema,
  
  currency: currencySchema,
  
  billingCycle: z
    .enum(billingCycleValues, {
      message: "Invalid billing cycle selected",
    })
    .default("monthly"),
  
  nextBillingDate: dateStringSchema,
  
  serviceUrl: urlSchema,
  
  isActive: z
    .boolean()
    .default(true),
  
  isAutoRenew: z
    .boolean()
    .default(true),
}).refine(
  (data) => {
    // If billing cycle is one_time, nextBillingDate can be optional
    if (data.billingCycle === "one_time") {
      return true;
    }
    return !!data.nextBillingDate;
  },
  {
    message: "Next billing date is required for recurring subscriptions",
    path: ["nextBillingDate"],
  }
);

/**
 * Subscription update schema
 * Schema for updating an existing subscription
 * All fields are optional except ID (for partial updates)
 */
export const subscriptionUpdateSchema = subscriptionsInsertschema
  .partial()
  .extend({
    id: z
      .string()
      .min(1, { message: "Subscription ID is required" })
      .regex(/^[a-zA-Z0-9_-]+$/, { message: "Invalid subscription ID format" }),
  });

/**
 * Subscription query/filter schema
 * Schema for filtering and querying subscriptions
 */
export const subscriptionFilterSchema = z.object({
  search: z.string().optional(),
  category: z.enum(subscriptionCategoryValues).optional(),
  billingCycle: z.enum(billingCycleValues).optional(),
  isActive: z.boolean().optional(),
  isAutoRenew: z.boolean().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
});

/**
 * TypeScript type exports
 */
export type SubscriptionInsert = z.infer<typeof subscriptionsInsertschema>;
export type SubscriptionUpdate = z.infer<typeof subscriptionUpdateSchema>;
export type SubscriptionFilter = z.infer<typeof subscriptionFilterSchema>;

/**
 * Utility functions for working with subscriptions
 */

/**
 * Format category name for display
 * Converts snake_case to Title Case
 */
export function formatCategoryName(category: SubscriptionCategory): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format billing cycle for display
 * Converts snake_case to Title Case
 */
export function formatBillingCycle(billingCycle: BillingCycle): string {
  return billingCycle
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Calculate monthly equivalent spending
 * Converts any billing cycle to monthly amount
 */
export function calculateMonthlySpending(
  amount: string | number,
  billingCycle: BillingCycle
): number {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount) || numAmount <= 0) return 0;

  switch (billingCycle) {
    case "monthly":
      return numAmount;
    case "yearly":
      return numAmount / 12;
    case "weekly":
      return numAmount * 4.33; // Average weeks per month
    case "one_time":
      return 0; // One-time payments don't count in monthly spending
    default:
      return numAmount;
  }
}

/**
 * Calculate yearly equivalent spending
 * Converts any billing cycle to yearly amount
 */
export function calculateYearlySpending(
  amount: string | number,
  billingCycle: BillingCycle
): number {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount) || numAmount <= 0) return 0;

  switch (billingCycle) {
    case "monthly":
      return numAmount * 12;
    case "yearly":
      return numAmount;
    case "weekly":
      return numAmount * 52;
    case "one_time":
      return 0; // One-time payments don't count in yearly spending
    default:
      return numAmount * 12;
  }
}

/**
 * Validate amount string
 * Checks if amount string is valid
 */
export function isValidAmount(amount: string): boolean {
  return amountSchema.safeParse(amount).success;
}

/**
 * Validate currency code
 * Checks if currency code is valid ISO 4217 format
 */
export function isValidCurrency(currency: string): boolean {
  return currencySchema.safeParse(currency).success;
}

/**
 * Validate date string
 * Checks if date string is in YYYY-MM-DD format
 */
export function isValidDateString(date: string): boolean {
  return dateStringSchema.safeParse(date).success;
}

/**
 * Format amount for display
 * Formats amount with currency symbol
 */
export function formatAmount(
  amount: string | number,
  currency: string = "USD"
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return `${currency} 0.00`;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(numAmount);
  } catch {
    return `${currency} ${numAmount.toFixed(2)}`;
  }
}

/**
 * Get default next billing date based on billing cycle
 * Calculates the next billing date from today
 */
export function getDefaultNextBillingDate(billingCycle: BillingCycle): string {
  const today = new Date();
  const nextDate = new Date(today);

  switch (billingCycle) {
    case "monthly":
      nextDate.setMonth(today.getMonth() + 1);
      break;
    case "yearly":
      nextDate.setFullYear(today.getFullYear() + 1);
      break;
    case "weekly":
      nextDate.setDate(today.getDate() + 7);
      break;
    case "one_time":
      // For one-time, return today's date
      break;
    default:
      nextDate.setMonth(today.getMonth() + 1);
  }

  return nextDate.toISOString().split("T")[0];
}

/**
 * Category display labels
 * Human-readable labels for categories
 */
export const categoryLabels: Record<SubscriptionCategory, string> = {
  entertainment: "Entertainment",
  professional: "Professional",
  software: "Software",
  cloud_storage: "Cloud Storage",
  music: "Music",
  video_streaming: "Video Streaming",
  gaming: "Gaming",
  news: "News",
  education: "Education",
  health_fitness: "Health & Fitness",
  other: "Other",
};

/**
 * Billing cycle display labels
 * Human-readable labels for billing cycles
 */
export const billingCycleLabels: Record<BillingCycle, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  weekly: "Weekly",
  one_time: "One Time",
};

/**
 * Get category label
 * Returns human-readable category name
 */
export function getCategoryLabel(category: SubscriptionCategory): string {
  return categoryLabels[category] || formatCategoryName(category);
}

/**
 * Get billing cycle label
 * Returns human-readable billing cycle name
 */
export function getBillingCycleLabel(billingCycle: BillingCycle): string {
  return billingCycleLabels[billingCycle] || formatBillingCycle(billingCycle);
}