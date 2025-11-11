import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { polarClient } from '@/lib/polar';
import { MAX_FREE_SUBSCRIPTIONS, MAX_PRO_SUBSCRIPTIONS } from '@/modules/premium/constants';
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

    // Get user's current subscription count
    const [userSubscriptions] = await db
      .select({
        count: count(subscriptions.id),
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.auth.user.id));

    // Check if user has an active premium subscription
    const activeSubscription = customer.activeSubscriptions[0];
    
    if (activeSubscription) {
      // User has a premium subscription - check plan limits
      const product = await polarClient.products.get({
        id: activeSubscription.productId,
      });

      // Check if product metadata has a subscription limit
      const metadataLimit = product.metadata?.subscriptionLimit 
        ? parseInt(product.metadata.subscriptionLimit as string, 10) 
        : null;

      // Determine plan type from product name (case-insensitive)
      // Handles variations like: "Pro", "Pro Plan", "Pro Yearly", "Pro Plan Yearly", "Pro (Personal)", etc.
      const planName = product.name?.toLowerCase().trim() || "";
      
      // Check for Pro plan - contains "pro" but not "business"
      // This works for all variations: monthly, yearly, personal, etc.
      const isProPlan = /pro/i.test(planName) && !/business/i.test(planName);
      
      // Check for Business plan
      const isBusinessPlan = /business/i.test(planName);

      // Apply plan-specific limits
      if (metadataLimit !== null && !isNaN(metadataLimit)) {
        // Use metadata limit if available
        if (entity === "subscriptions" && userSubscriptions.count >= metadataLimit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You have reached the maximum number of subscriptions for your plan (${metadataLimit}). Upgrade for more subscriptions.`,
          });
        }
      } else if (isBusinessPlan) {
        // Business plan has unlimited subscriptions - no limit check
        // Allow the request to proceed
      } else if (isProPlan) {
        // Pro plan has a limit of 10 subscriptions
        if (entity === "subscriptions" && userSubscriptions.count >= MAX_PRO_SUBSCRIPTIONS) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You have reached the maximum number of subscriptions for Pro plan (${MAX_PRO_SUBSCRIPTIONS}). Upgrade to Business plan for unlimited subscriptions.`,
          });
        }
      } else {
        // Unknown premium plan - treat as unlimited for safety
        // This handles edge cases where plan name doesn't match expected patterns
      }
    } else {
      // No active premium subscription - apply free plan limit
      if (entity === "subscriptions" && userSubscriptions.count >= MAX_FREE_SUBSCRIPTIONS) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have reached the maximum number of free subscriptions",
        });
      }
    }

    return next({ ctx: { ...ctx, customer } });
  });