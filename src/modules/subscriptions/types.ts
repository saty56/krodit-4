import { inferRouterOutputs } from "@trpc/server";

import type {AppRouter} from "@/trpc/routers/_app";

export type  SubscriptionListOne = inferRouterOutputs<AppRouter>["subscriptions"]["listOne"];