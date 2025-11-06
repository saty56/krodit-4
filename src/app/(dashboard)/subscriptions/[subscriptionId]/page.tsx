import { Suspense } from "react";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { SubscriptionIdView, SubscriptionIdViewLoading, SubscriptionIdViewError } from "@/modules/subscriptions/ui/views/subscription-id-view";

interface Props {
    params: Promise<{ subscriptionId: string }>

};

const Page = async ({ params }: Props) => {
    const { subscriptionId } = await params;

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
        trpc.subscriptions.listOne.queryOptions({ id: subscriptionId }),
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
           <Suspense fallback={<SubscriptionIdViewLoading/>}> 
            <ErrorBoundary FallbackComponent={SubscriptionIdViewError}>
              <SubscriptionIdView subscriptionId={subscriptionId} />
            </ErrorBoundary>
           </Suspense>
        </HydrationBoundary>
     );
};

export default Page;