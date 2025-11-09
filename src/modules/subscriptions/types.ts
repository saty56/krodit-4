import { inferRouterOutputs } from "@trpc/server";

import type {AppRouter} from "@/trpc/routers/_app";

export type  SubscriptionListOne = inferRouterOutputs<AppRouter>["subscriptions"]["listOne"];

export type SubscriptionCreated = {
  id: string;
  name: string;
  instructions: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate: string;
};