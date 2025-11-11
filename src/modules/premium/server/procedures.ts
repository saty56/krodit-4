import { eq, count } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { polarClient } from "@/lib/polar";
import {
    createTRPCRouter,
    protectedProcedure,
} from "@/trpc/init";


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

        if (subscription) {
            return null;
        }
 
        const [userSubscriptions] = await db
         .select({
            count: count(subscriptions.id),
         })
         .from(subscriptions)
         .where(eq(subscriptions.userId, ctx.auth.user.id));

         return {
            subscriptionCount: userSubscriptions.count,
         };
    })
});