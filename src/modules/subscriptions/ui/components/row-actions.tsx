"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { SubscriptionForm } from "./subscription-form";
import { SubscriptionListOne } from "../../types";

/**
 * Props for RowActions component
 */
interface RowActionsProps {
  item: SubscriptionListOne;
}

/**
 * Action buttons component for subscription table rows
 * Provides Edit and Cancel/Deactivate functionality
 */
export function RowActions({ item }: RowActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Mutation for updating subscription (used for cancel/deactivate)
  const update = useMutation(
    trpc.subscriptions.update.mutationOptions({
      onSuccess: async () => {
        // Invalidate list to refresh table
        await queryClient.invalidateQueries(trpc.subscriptions.listMany.queryOptions({}));
        
        // Invalidate individual subscription if we have an ID
        if (item?.id) {
          await queryClient.invalidateQueries(
            trpc.subscriptions.listOne.queryOptions({ id: item.id })
          );
        }
      },
    })
  );

  /**
   * Handle cancel/deactivate subscription
   * Updates the subscription with isActive: false while preserving all other fields
   */
  const onCancelService = () => {
    if (!item?.id) return;
    // Convert null values to undefined for the update schema compatibility
    const updateData = {
      ...item,
      id: item.id,
      isActive: false,
      instructions: item.instructions ?? undefined,
      nextBillingDate: item.nextBillingDate ?? undefined,
      serviceUrl: item.serviceUrl ?? undefined,
    };
    update.mutate(updateData);
  };

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={onCancelService} 
        disabled={update.isPending}
      >
        {item?.isActive === false ? "Cancelled" : "Cancel"}
      </Button>

      {/* Edit subscription dialog */}
      <ResponsiveDialog
        title="Edit Subscription"
        description="Update subscription details"
        open={open}
        onOpenChange={setOpen}
      >
        <SubscriptionForm
          initialValues={item}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </ResponsiveDialog>
    </div>
  );
}


