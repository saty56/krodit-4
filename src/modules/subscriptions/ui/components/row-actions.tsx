"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { SubscriptionForm } from "./subscription-form";

interface RowActionsProps {
  item: any;
}

export function RowActions({ item }: RowActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const update = useMutation(
    trpc.subscriptions.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.subscriptions.listMany.queryOptions({}));
        if (item?.id) {
          await queryClient.invalidateQueries(trpc.subscriptions.listOne.queryOptions({ id: item.id }));
        }
      },
    })
  );

  const onCancelService = () => {
    if (!item?.id) return;
    // send all current fields except overwrite isActive
    update.mutate({ ...item, isActive: false });
  };

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <Button variant="destructive" size="sm" onClick={onCancelService} disabled={update.isPending}>
        {item?.isActive === false ? "Cancelled" : "Cancel"}
      </Button>

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


