import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { polarClient } from '@/lib/polar';
import { MAX_FREE_SUBSCRIPTIONS } from '@/modules/premium/constants';
import { initTRPC, TRPCError } from '@trpc/server';
import { count, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { cache } from 'react';
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: 'user_123' };
});
// Avoid exporting the entire t-object
// since it's not very descriptive. 
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new TRPCError({ code:"UNAUTHORIZED", message:"Unauthorized"});
  }

  return next({ ctx: {...ctx, auth: session }});
});
export const premiumProcedure = (entity: "subscriptions") =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const customer = await polarClient.customers.getStateExternal({
      externalId: ctx.auth.user.id,
    });

    const [userSubscriptions] = await db
         .select({
            count: count(subscriptions.id),
         })
         .from(subscriptions)
         .where(eq(subscriptions.userId, ctx.auth.user.id));

         const isFreeSubscriptionLimitReached = userSubscriptions.count >= MAX_FREE_SUBSCRIPTIONS;
  
         const shouldThrowSubscriptionError =
        entity === "subscriptions" && isFreeSubscriptionLimitReached;

         if (shouldThrowSubscriptionError) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You have reached the maximum number of free subscriptions",
          });
         }
         
           return next({ ctx: { ...ctx, customer } });
        });