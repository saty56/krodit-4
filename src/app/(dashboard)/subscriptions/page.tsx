import { Suspense } from "react";
import { getQueryClient, trpc } from "@/trpc/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { SubscriptionsListHeader } from "@/modules/subscriptions/ui/components/subscriptions-list-header";

import { 
  SubscriptionsView, 
  SubscriptionsViewError, 
  SubscriptionsViewLoading 
} from "@/modules/subscriptions/ui/views/subscriptions-view";



const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }


  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.subscriptions.listMany.queryOptions({}));

  return (
    <>
    <SubscriptionsListHeader />
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SubscriptionsViewLoading />}>
        <ErrorBoundary FallbackComponent={SubscriptionsViewError}>
        <SubscriptionsView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
    </>
  );
}

export default Page;