import { z } from 'zod';

import { subscriptionsRouter } from '@/modules/subscriptions/server/procedures';

import { baseProcedure, createTRPCRouter } from '../init';

export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query(({ input }) => ({
      greeting: `Hello ${input.text}!`,
    })),
  subscriptions: subscriptionsRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;