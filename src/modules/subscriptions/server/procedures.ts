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
    })
}); 