import { z } from "zod"
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { subscriptionsInsertschema, subscriptionUpdateSchema} from "../schema";
import { eq, ilike, and, desc, count } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";

export const subscriptionsRouter = createTRPCRouter({
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
  listOne: protectedProcedure
  .input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const [exitingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, input.id), 
         eq(subscriptions.userId, ctx.auth.user.id)
        )
      );

    return exitingSubscription;
  }),
  listMany: protectedProcedure
  .input(z.object({
    page: z.number().default(DEFAULT_PAGE),
    pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    search: z.string().nullish()
  }))
  .query(async ({ ctx, input }) => {
    const { page, pageSize, search } = input;

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
  update: protectedProcedure
  .input(subscriptionsInsertschema.extend({ id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    const payload = {
      ...data,
      nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
    };

    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(payload)
      .where(
        and(
          eq(subscriptions.id, id),
          eq(subscriptions.userId, ctx.auth.user.id)
        )
      )
      .returning();

    return updatedSubscription;
  })
}); 