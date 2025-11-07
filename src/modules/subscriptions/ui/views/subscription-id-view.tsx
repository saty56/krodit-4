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
import { getLogoUrlViaApi } from "@/lib/logo-api";
import { UpdateSubscriptionDialog } from "../components/update-subscription-dialog";
import { useConfirm } from "@/hooks/use-confirm";

function LogoByName({ name, className }: { name: string; className?: string }) {
    const [src, setSrc] = React.useState<string>("");
    React.useEffect(() => {
        let mounted = true;
        const q = String(name || "").trim();
        if (!q) { setSrc(""); return; }
        getLogoUrlViaApi(q).then((url) => {
            if (!mounted) return;
            setSrc(url || "");
        });
        return () => { mounted = false; };
    }, [name]);

    if (!name) return (
        <div className={className || "size-10"} />
    );

    if (!src) return (
        <div className={(className || "size-10") + " rounded bg-muted"} />
    );

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={name}
            className={(className || "size-10") + " rounded"}
            onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; }}
        />
    );
}

interface Props {
    subscriptionId: string;
}; 

export const SubscriptionIdView = ({ subscriptionId }: Props) => {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [updateSubscriptionDialogOpen, setUpdateSubscriptionDialogOpen] = useState(false);

    const { data } = useSuspenseQuery(trpc.subscriptions.listOne.queryOptions({ id: subscriptionId }));

     const removeSubscription = useMutation(
        trpc.subscriptions.remove.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(trpc.subscriptions.listMany.queryOptions({}));
                router.push("/subscriptions");
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }),
    );

    const [RemoveConfirmation, confirmRemove] = useConfirm("Delete Subscription", "Are you sure you want to delete this subscription?");

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
        <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
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
                                {(() => {
                                    const raw = (data as any)?.amount ?? "0.00";
                                    const currency = (data as any)?.currency ?? "USD";
                                    try {
                                        const n = parseFloat(String(raw));
                                        return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(isFinite(n) ? n : 0);
                                    } catch {
                                        return String(raw);
                                    }
                                })()}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Next billing date</span>
                            <span className="font-medium">
                                {(() => {
                                    const d = (data as any)?.nextBillingDate as Date | string | undefined;
                                    if (!d) return "-";
                                    const date = typeof d === "string" ? new Date(d) : d;
                                    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
                                })()}
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
