import { z } from "zod"
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { subscriptionsInsertschema } from "../schema";
import { eq } from "drizzle-orm";

export const subscriptionsRouter = createTRPCRouter({
  // TODO: change 'listOne' to use 'protectedProcedure' 
  listOne: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const [exitingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, input.id));

    return exitingSubscription;
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const data = await db
      .select()
      .from(subscriptions);

    return data;
  }),
  create: protectedProcedure
  .input(subscriptionsInsertschema)
  .mutation(async ({ input, ctx }) => {
    const [createdSubscription] = await db
        .insert(subscriptions)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

        return createdSubscription;
  })
}); 