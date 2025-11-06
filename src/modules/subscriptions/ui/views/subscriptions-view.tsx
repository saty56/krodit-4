"use client";

import { useRouter } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "../components/data-table";
import { columns} from "../components/columns";
import { useSubscriptionsFilters } from "../../hooks/use-subscriptions-filters";
import { DataPagination } from "../components/data-pagination";

export const SubscriptionsView = () => {
  const router = useRouter();
const {filters, setFilters} = useSubscriptionsFilters();

  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.subscriptions.listMany.queryOptions({
      ...filters,
    })
  );

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {data.items.length === 0 ? (
        <EmptyState title="No subscriptions found" description="You don't have any subscriptions yet" />
      ) : (
        <DataTable 
        data={data.items} 
        columns={columns}
        onRowClick={(row) => router.push(`/subscriptions/${row.id}`)} />
      )}
        <DataPagination
        page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => setFilters({ page })}
        />
      
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
        description="Failed to fetch your subscriptions" />
    )
}
