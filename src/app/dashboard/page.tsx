import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getQueryClient, trpc } from "@/trpc/server";
import { auth } from "@/lib/auth";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { 
  HomeView,
  HomeViewLoading,
  HomeViewError 
} from "@/modules/home/ui/views/home-view";

/**
 * Dashboard home page at /dashboard
 * Displays overview of subscriptions, spending, and quick actions
 */
const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Prefetch data for home page
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.subscriptions.getReport.queryOptions());
  void queryClient.prefetchQuery(
    trpc.subscriptions.listMany.queryOptions({ page: 1, pageSize: 5 })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<HomeViewLoading />}>
        <ErrorBoundary FallbackComponent={HomeViewError}>
          <HomeView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;

