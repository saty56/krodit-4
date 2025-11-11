import { eq, count } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { polarClient } from "@/lib/polar";
import {
    createTRPCRouter,
    protectedProcedure,
} from "@/trpc/init";
import { MAX_FREE_SUBSCRIPTIONS, MAX_PRO_SUBSCRIPTIONS } from "../constants";


export const premiumRouter = createTRPCRouter({
    getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
        const customer = await polarClient.customers.getStateExternal({
            externalId: ctx.auth.user.id,
        });

        const subscription = customer.activeSubscriptions[0];

        if (!subscription) {
            return null;
        }

        const product = await polarClient.products.get({
            id: subscription.productId,
        });

        return product;
    }),
    getProducts: protectedProcedure.query(async () => {
        const products = await polarClient.products.list({
            isArchived: false,
            isRecurring: true,
            sorting: ["price_amount"],
        });

        return products.result.items
    }),
    getFreeUsage: protectedProcedure.query(async ({ ctx }) =>{
        const customer =await polarClient.customers.getStateExternal({
            externalId: ctx.auth.user.id,
        });

        const subscription = customer.activeSubscriptions[0];

        // Get user's subscription count
        const [userSubscriptions] = await db
         .select({
            count: count(subscriptions.id),
         })
         .from(subscriptions)
         .where(eq(subscriptions.userId, ctx.auth.user.id));

        // If no active subscription, return free plan usage
        if (!subscription) {
            return {
                subscriptionCount: userSubscriptions.count,
                planType: "free" as const,
                maxSubscriptions: MAX_FREE_SUBSCRIPTIONS,
            };
        }

        // Get product to determine plan type
        const product = await polarClient.products.get({
            id: subscription.productId,
        });

        // Check if product metadata has a subscription limit
        const metadataLimit = product.metadata?.subscriptionLimit 
            ? parseInt(product.metadata.subscriptionLimit as string, 10) 
            : null;

        // Determine plan type from product name (case-insensitive)
        const planName = product.name?.toLowerCase().trim() || "";
        const isProPlan = /pro/i.test(planName) && !/business/i.test(planName);
        const isBusinessPlan = /business/i.test(planName);

        // Business plan has unlimited - don't show usage component
        if (isBusinessPlan) {
            return null;
        }

        // Pro plan - show usage with 10 limit
        if (isProPlan) {
            return {
                subscriptionCount: userSubscriptions.count,
                planType: "pro" as const,
                maxSubscriptions: metadataLimit && !isNaN(metadataLimit) ? metadataLimit : MAX_PRO_SUBSCRIPTIONS,
            };
        }

        // If metadata limit exists, use it
        if (metadataLimit !== null && !isNaN(metadataLimit)) {
            return {
                subscriptionCount: userSubscriptions.count,
                planType: "premium" as const,
                maxSubscriptions: metadataLimit,
            };
        }

        // Unknown premium plan - don't show usage (assume unlimited)
        return null;
    })
});