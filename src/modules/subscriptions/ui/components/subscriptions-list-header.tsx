"use client";

import {useState} from "react";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { NewSubscriptionDialog } from "./new-subscription-dialog";

export const SubscriptionsListHeader = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <> 
    <NewSubscriptionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}/>
    <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
      <h5 className="text-lg font-medium">My Subscriptions</h5>
      <Button onClick={() => setIsDialogOpen(true)}>
        <PlusIcon className="size-4" />
        Add Subscriptions
        </Button>
    </div>
    </div>
    </>
  );
};
