"use client";

import {useState} from "react";

import { PlusIcon, Search, XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { NewSubscriptionDialog } from "./new-subscription-dialog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useSubscriptionsFilters } from "../../hooks/use-subscriptions-filters";
import { SubscriptionsSearchFilter } from "./subscriptions-search-filter";
import { DEFAULT_PAGE } from "@/constants";

export const SubscriptionsListHeader = () => {
  const {filters, setFilters} = useSubscriptionsFilters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.subscriptions.listMany.queryOptions({}));
  const activeCount = (data?.items || []).filter((sub: any) => sub.isActive).length;

   const isAnyFilterModified = !!filters.search;

   const onClearFilters = () => {
    setFilters({
      search:"",
      page:DEFAULT_PAGE,
    });
   }

  return (
    <> 
    <NewSubscriptionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}/>
    <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-medium">My Subscriptions
          <span className="ml-2 inline-flex items-center px-2 rounded-full border border-muted bg-white text-sm text-muted-foreground">
            {activeCount} active
          </span>
        </h5>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusIcon className="size-4" />
          Add Subscriptions
        </Button>
      </div>
      <div className="flex items-center gap-x-x p-1">
      <SubscriptionsSearchFilter />
      {isAnyFilterModified && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <XCircleIcon />
          Clear
        </Button>
      )}
      </div>
    </div>
    </>
  );
};
