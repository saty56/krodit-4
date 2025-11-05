"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { DataTable } from "../components/data-table";
import { columns} from "../components/columns";

export const SubscriptionsView = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.subscriptions.list.queryOptions()
  );

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <DataTable data={data} columns={columns} />
    </div>
  );
};


export const SubscriptionsViewLoading = () => {
    return (
        <LoadingState 
        title="Loading subscriptions" 
        description="Fetching your subscriptions" />
    );
}

export const SubscriptionsViewError = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
    return (
        <ErrorState 
        title="Error loading subscriptions"
        description={error?.message || "Failed to fetch your subscriptions"} />
    )
}
