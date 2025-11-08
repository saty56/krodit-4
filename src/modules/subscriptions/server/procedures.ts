import { z } from "zod";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { subscriptionsInsertschema, subscriptionUpdateSchema } from "../schema";
import { eq, ilike, and, desc, count } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";

/**
 * TRPC router for subscription-related operations
 * All procedures are protected and require authentication
 */
export const subscriptionsRouter = createTRPCRouter({
  /**
   * Update an existing subscription
   * Only allows users to update their own subscriptions
   */
  update: protectedProcedure
    .input(subscriptionUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedSubscription] = await db
        .update(subscriptions)
        .set({
          ...input,
          nextBillingDate: input.nextBillingDate ? new Date(input.nextBillingDate) : null,
        })
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.auth.user.id)
          )
        )
        .returning();

      if (!updatedSubscription) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
      }

      return updatedSubscription;
    }),

  /**
   * Remove (delete) a subscription
   * Only allows users to delete their own subscriptions
   */
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedSubscription] = await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.auth.user.id)
          )
        )
        .returning();

      if (!removedSubscription) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
      }

      return removedSubscription;
    }),

  /**
   * Get a single subscription by ID
   * Only returns subscriptions owned by the authenticated user
   */
  listOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.id, input.id), 
            eq(subscriptions.userId, ctx.auth.user.id)
          )
        );

      return subscription;
    }),

  /**
   * Get paginated list of subscriptions with optional search
   * Only returns subscriptions owned by the authenticated user
   */
  listMany: protectedProcedure
    .input(z.object({
      page: z.number().default(DEFAULT_PAGE),
      pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
      search: z.string().nullish()
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;

      // Fetch paginated subscriptions with optional search filter
      const data = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, ctx.auth.user.id),
            search ? ilike(subscriptions.name, `%${search}%`) : undefined,
          )
        )
        .orderBy(desc(subscriptions.createdAt), desc(subscriptions.name))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      // Get total count for pagination
      const total = await db
        .select({ count: count() })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, ctx.auth.user.id),
          )
        );

      const countValue = total[0]?.count ?? 0;
      const totalPages = Math.ceil(countValue / pageSize);

      return {
        items: data,
        total: countValue, 
        totalPages,
      };
    }),

  /**
   * Create a new subscription
   * Automatically associates the subscription with the authenticated user
   */
  create: protectedProcedure
    .input(subscriptionsInsertschema)
    .mutation(async ({ input, ctx }) => {
      const payload = {
        ...input,
        nextBillingDate: input.nextBillingDate ? new Date(input.nextBillingDate) : null,
        userId: ctx.auth.user.id,
      };

      const [createdSubscription] = await db
        .insert(subscriptions)
        .values(payload)
        .returning();

      return createdSubscription;
    }),

  /**
   * Get all subscriptions for export
   * Returns all subscriptions without pagination for data export
   */
  getAllForExport: protectedProcedure
    .query(async ({ ctx }) => {
      const allSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.auth.user.id))
        .orderBy(desc(subscriptions.createdAt), desc(subscriptions.name));

      return allSubscriptions;
    }),

  /**
   * Get analytics and report data for subscriptions
   * Returns statistics, spending breakdown, and category analysis
   */
  getReport: protectedProcedure
    .query(async ({ ctx }) => {
      // Get all subscriptions for the user
      const allSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.auth.user.id));

      // Calculate total counts
      const totalSubscriptions = allSubscriptions.length;
      const activeSubscriptions = allSubscriptions.filter((s) => s.isActive).length;
      const inactiveSubscriptions = totalSubscriptions - activeSubscriptions;

      // Calculate spending by converting amounts and handling different billing cycles
      const calculateMonthlySpending = (sub: typeof allSubscriptions[0]): number => {
        const amount = parseFloat(sub.amount || "0");
        if (amount === 0) return 0;

        switch (sub.billingCycle) {
          case "monthly":
            return amount;
          case "yearly":
            return amount / 12;
          case "weekly":
            return amount * 4.33; // Average weeks per month
          case "one_time":
            return 0; // One-time payments don't count in monthly spending
          default:
            return amount;
        }
      };

      const calculateYearlySpending = (sub: typeof allSubscriptions[0]): number => {
        const amount = parseFloat(sub.amount || "0");
        if (amount === 0) return 0;

        switch (sub.billingCycle) {
          case "monthly":
            return amount * 12;
          case "yearly":
            return amount;
          case "weekly":
            return amount * 52;
          case "one_time":
            return 0;
          default:
            return amount * 12;
        }
      };

      // Calculate total spending (only active subscriptions)
      const activeSubs = allSubscriptions.filter((s) => s.isActive);
      
      // Group spending by currency
      const spendingByCurrency: Record<string, { monthly: number; yearly: number }> = {};
      activeSubs.forEach((sub) => {
        const currency = sub.currency || "USD";
        if (!spendingByCurrency[currency]) {
          spendingByCurrency[currency] = { monthly: 0, yearly: 0 };
        }
        spendingByCurrency[currency].monthly += calculateMonthlySpending(sub);
        spendingByCurrency[currency].yearly += calculateYearlySpending(sub);
      });

      // Calculate totals (for backward compatibility, use currency with highest monthly spending)
      const currencies = Object.keys(spendingByCurrency);
      const primaryCurrency = currencies.length > 0
        ? currencies.reduce((prev, curr) =>
            (spendingByCurrency[curr]?.monthly || 0) >
            (spendingByCurrency[prev]?.monthly || 0)
              ? curr
              : prev
          )
        : "USD";
      const totalMonthlySpending = spendingByCurrency[primaryCurrency]?.monthly || 0;
      const totalYearlySpending = spendingByCurrency[primaryCurrency]?.yearly || 0;

      // Spending by category (grouped by currency)
      const spendingByCategory: Record<string, { monthly: number; yearly: number; count: number; currency: string }> = {};
      
      activeSubs.forEach((sub) => {
        const category = sub.category || "other";
        const currency = sub.currency || "USD";
        const key = `${category}_${currency}`;
        if (!spendingByCategory[key]) {
          spendingByCategory[key] = { monthly: 0, yearly: 0, count: 0, currency };
        }
        spendingByCategory[key].monthly += calculateMonthlySpending(sub);
        spendingByCategory[key].yearly += calculateYearlySpending(sub);
        spendingByCategory[key].count += 1;
      });

      // Convert to array format for charts (group by category, show currency)
      // Split on last underscore to preserve categories with underscores (e.g., "cloud_storage")
      const categoryBreakdown = Object.entries(spendingByCategory).map(([key, data]) => {
        const lastUnderscoreIndex = key.lastIndexOf('_');
        const category = lastUnderscoreIndex !== -1 
          ? key.substring(0, lastUnderscoreIndex)
          : key;
        return {
          category: category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          monthly: Math.round(data.monthly * 100) / 100,
          yearly: Math.round(data.yearly * 100) / 100,
          count: data.count,
          currency: data.currency,
        };
      });

      // Upcoming billing dates (next 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const upcomingBilling = activeSubs
        .filter((sub) => {
          if (!sub.nextBillingDate) return false;
          const billingDate = new Date(sub.nextBillingDate);
          return billingDate >= now && billingDate <= thirtyDaysFromNow;
        })
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
          amount: sub.amount,
          currency: sub.currency,
          nextBillingDate: sub.nextBillingDate,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.nextBillingDate!).getTime();
          const dateB = new Date(b.nextBillingDate!).getTime();
          return dateA - dateB;
        })
        .slice(0, 10); // Top 10 upcoming

      // Billing cycle distribution
      const billingCycleDistribution = activeSubs.reduce((acc, sub) => {
        const cycle = sub.billingCycle || "monthly";
        acc[cycle] = (acc[cycle] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Auto-renew statistics
      const autoRenewCount = activeSubs.filter((s) => s.isAutoRenew).length;
      const manualRenewCount = activeSubs.length - autoRenewCount;

      return {
        summary: {
          totalSubscriptions,
          activeSubscriptions,
          inactiveSubscriptions,
          totalMonthlySpending: Math.round(totalMonthlySpending * 100) / 100,
          totalYearlySpending: Math.round(totalYearlySpending * 100) / 100,
          autoRenewCount,
          manualRenewCount,
          spendingByCurrency: Object.entries(spendingByCurrency).map(([currency, data]) => ({
            currency,
            monthly: Math.round(data.monthly * 100) / 100,
            yearly: Math.round(data.yearly * 100) / 100,
          })),
        },
        categoryBreakdown,
        upcomingBilling,
        billingCycleDistribution,
      };
    }),
}); 