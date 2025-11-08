"use client";

import { toast } from "sonner";
import { useState } from "react";
import React from "react";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { SubscriptionIdViewHeader } from "../components/subscription-id-view-header";
import { Badge } from "@/components/ui/badge";
import { CreditCardIcon } from "lucide-react";
import { UpdateSubscriptionDialog } from "../components/update-subscription-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { cancelReminderNotifications } from "@/lib/notification-service";
import { formatCurrency, formatDate } from "@/lib/format-utils";
import { LogoByName } from "@/components/logo-by-name";

/**
 * Props for SubscriptionIdView component
 */
interface Props {
    subscriptionId: string;
}

/**
 * View component for displaying a single subscription's details
 * Includes edit and delete functionality
 */
export const SubscriptionIdView = ({ subscriptionId }: Props) => {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [updateSubscriptionDialogOpen, setUpdateSubscriptionDialogOpen] = useState(false);

    // Fetch subscription data
    const { data } = useSuspenseQuery(
        trpc.subscriptions.listOne.queryOptions({ id: subscriptionId })
    );

    // Mutation for removing/deleting subscription
    const removeSubscription = useMutation(
        trpc.subscriptions.remove.mutationOptions({
            onSuccess: async () => {
                // Cancel scheduled notifications for this subscription
                await cancelReminderNotifications(subscriptionId);
                
                await queryClient.invalidateQueries(
                    trpc.subscriptions.listMany.queryOptions({})
                );
                router.push("/subscriptions");
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }),
    );

    // Confirmation dialog for delete action
    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Delete Subscription", 
        "Are you sure you want to delete this subscription?"
    );

    /**
     * Handle subscription removal with confirmation
     */
    const handleRemoveSubscription = async () => {
        const ok = await confirmRemove();
        if (!ok) return;
        
        await removeSubscription.mutateAsync({ id: subscriptionId });
    };

    return (
        <>
        <RemoveConfirmation />
        <UpdateSubscriptionDialog
        open={updateSubscriptionDialogOpen}
        onOpenChange={setUpdateSubscriptionDialogOpen}
        initialValues={data}
        />
        <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4 sidebar-page-container">
            <SubscriptionIdViewHeader
            subscriptionId={subscriptionId}
            subscriptionName={data.name}
            onEdit={() => setUpdateSubscriptionDialogOpen(true)}
            onRemove={handleRemoveSubscription}
            />
            <div className="bg-white rounded-lg border">
                <div className="px-4 py-5 gap-y-5 flex flex-col  col-span-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-3">
                            <LogoByName name={data?.name || ""} className="size-10" />
                             <h2 className="text-2xl font-medium">{data.name}</h2>
                        </div>
                        <Badge
                        variant="outline"
                        className="flex items-center gap-x-2 [&>svg]:size-4">
                            <CreditCardIcon />
                            {data.isActive ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Amount</span>
                            <span className="font-medium">
                                {formatCurrency((data as any)?.amount, (data as any)?.currency)}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Next billing date</span>
                            <span className="font-medium">
                                {formatDate((data as any)?.nextBillingDate)}
                            </span>
                        </div>
                        <div className="flex flex-col sm:col-span-1 col-span-1">
                            <span className="text-xs text-muted-foreground">Instructions</span>
                            <span className="font-medium truncate" title={(data as any)?.instructions || "-"}>
                                {((data as any)?.instructions as string) || "-"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export const SubscriptionIdViewLoading = () => {
    return (
        <LoadingState 
        title="Loading Subscription" 
        description="This may take a few seconds" />
    );
}

export const SubscriptionIdViewError = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
    return (
        <ErrorState 
        title="Error loading Subscription"
        description="Something went wrong" />
    )
}
