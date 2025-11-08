import { Suspense } from "react";
import { getQueryClient, trpc } from "@/trpc/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { 
  ReportView, 
  ReportViewError, 
  ReportViewLoading 
} from "@/modules/reports/ui/views/report-view";

/**
 * Report page - displays subscription analytics and insights
 */
const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Prefetch report data
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.subscriptions.getReport.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ReportViewLoading />}>
        <ErrorBoundary FallbackComponent={ReportViewError}>
          <ReportView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;

