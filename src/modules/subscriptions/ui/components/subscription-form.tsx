import React from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useTRPC } from "@/trpc/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedAvatar } from "@/components/gen-avatar";
import { Switch } from "@/components/ui/switch";
import { getLogoUrlViaApi } from "@/lib/logo-api";
import { fallbackIconUrls } from "@/lib/logos";

import { SubscriptionListOne } from "../../types";
import { subscriptionsInsertschema, subscriptionCategoryValues, billingCycleValues } from "../../schema";
import { toast } from "sonner";
import { cancelReminderNotifications } from "@/lib/notification-service";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

/**
 * Props for the SubscriptionForm component
 */
interface SubscriptionFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: SubscriptionListOne;
}

/**
 * Form component for creating and editing subscriptions
 * Handles both create and update operations based on initialValues
 */
export const SubscriptionForm = ({
    onSuccess,
    onCancel,
    initialValues,
}: SubscriptionFormProps) => {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient(); 

    // Mutation for creating a new subscription
    const createSubscription = useMutation(
        trpc.subscriptions.create.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(
                    trpc.subscriptions.listMany.queryOptions({})
                );
                await queryClient.invalidateQueries(
                    trpc.premium.getFreeUsage.queryOptions(),
                );

                onSuccess?.();
            },
            onError: (error) => { 
                toast.error(error.message);

               if (error.data?.code === "FORBIDDEN") {
                  router.push("/upgrade")
               }
            },
        }),
    );

    // Mutation for updating an existing subscription
    const updateSubscription = useMutation(
        trpc.subscriptions.update.mutationOptions({
            onSuccess: async (updatedSubscription, variables) => {
                // Cancel notifications if billing date changed or subscription was deactivated
                if (initialValues?.id) {
                    // Normalize dates for comparison (both might be Date objects or strings)
                    const normalizeDate = (date: Date | string | null | undefined): string => {
                        if (!date) return '';
                        if (date instanceof Date) return date.toISOString().split('T')[0];
                        if (typeof date === 'string') {
                            // If it's already in YYYY-MM-DD format, return as is
                            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
                            // Otherwise try to parse it
                            const d = new Date(date);
                            return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
                        }
                        return '';
                    };
                    
                    const oldDate = normalizeDate(initialValues.nextBillingDate);
                    const newDate = normalizeDate(variables.nextBillingDate);
                    const billingDateChanged = oldDate !== newDate;
                    const wasDeactivated = 
                        (initialValues as any).isActive && !variables.isActive;
                    
                    if (billingDateChanged || wasDeactivated) {
                        await cancelReminderNotifications(initialValues.id);
                    }
                }

                await queryClient.invalidateQueries(
                    trpc.subscriptions.listMany.queryOptions({})
                );

                // Invalidate the specific subscription if editing
                if (initialValues?.id) {
                    await queryClient.invalidateQueries(
                        trpc.subscriptions.listOne.queryOptions({ id: initialValues.id })
                    );
                }  
                onSuccess?.();
            },
            onError: (error) => { 
                toast.error(error.message);

                // TODO: Check if error code is "FORBIDDEN", redirect to "/upgrade"
            },
        }),
    );

    // Helper function to format nextBillingDate for the date input
    const formatNextBillingDate = (date: any): string => {
        if (!date) return "";
        const d = date instanceof Date ? date : new Date(date);
        return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
    };

    // Initialize form with default values or initial values for editing
    const form = useForm<z.infer<typeof subscriptionsInsertschema>>({
        resolver: zodResolver(subscriptionsInsertschema) as any,
        defaultValues: {
            name: initialValues?.name ?? "",
            instructions: (initialValues as any)?.instructions ?? "",
            category: (initialValues as any)?.category ?? "other",
            amount: (initialValues as any)?.amount ?? "0.00",
            currency: (initialValues as any)?.currency ?? "USD",
            billingCycle: (initialValues as any)?.billingCycle ?? "monthly",
            nextBillingDate: formatNextBillingDate((initialValues as any)?.nextBillingDate),
            isActive: (initialValues as any)?.isActive ?? true,
            isAutoRenew: (initialValues as any)?.isAutoRenew ?? true,
        } as any,
    });
    const control = form.control as any;

    // Logo fetching: Watch the name field and fetch logo when it changes
    const watchedName = form.watch("name") || "";
    const [logoSrc, setLogoSrc] = React.useState<string>("");
    const [logoLoading, setLogoLoading] = React.useState<boolean>(false);
    
    React.useEffect(() => {
        let active = true;
        const q = String(watchedName || "").trim();
        
        if (!q) { 
            setLogoSrc(""); 
            setLogoLoading(false); 
            return; 
        }
        
        setLogoLoading(true);
        getLogoUrlViaApi(q)
            .then((url) => {
                if (!active) return;
                if (url) {
                    setLogoSrc(url);
                } else {
                    // Fallback to generated icon URLs if API doesn't return a logo
                    const fallbacks = fallbackIconUrls(q, 128);
                    setLogoSrc(fallbacks[0] || "");
                }
            })
            .finally(() => { 
                if (active) setLogoLoading(false); 
            });
        
        return () => { 
            active = false; 
        };
    }, [watchedName]);

    const isEdit = !!initialValues?.id;
    const isPending = createSubscription.isPending || updateSubscription.isPending;

    // Handle form submission - either create or update based on isEdit
    const onSubmit: SubmitHandler<z.infer<typeof subscriptionsInsertschema>> = (values) => {
        if (isEdit) {
            updateSubscription.mutate({ ...values, id: initialValues.id });
        } else {
            createSubscription.mutate(values);
        }
    };

    // Handle logo image error - try fallback URLs sequentially
    const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const el = e.currentTarget as HTMLImageElement;
        const fallbacks = fallbackIconUrls(watchedName, 128);
        const idx = Number(el.dataset.fbIndex || 0);
        
        if (idx < fallbacks.length) {
            el.dataset.fbIndex = String(idx + 1);
            el.src = fallbacks[idx];
        } else {
            // Stop trying after all fallbacks exhausted
            el.onerror = null;
        }
    };

    return (
        <Form {...(form as any)}>
            <form className="space-y-4 md:space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                {/* Logo preview section - shows loading, logo, or generated avatar */}
                <div className="border size-14 sm:size-16 rounded-md overflow-hidden flex items-center justify-center bg-muted/20 mx-auto sm:mx-0">
                    {watchedName ? (
                        logoLoading ? (
                            <div className="w-full h-full animate-pulse bg-muted" />
                        ) : logoSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={logoSrc}
                                alt={watchedName || "Service logo"}
                                className="w-full h-full object-contain"
                                onError={handleLogoError}
                            />
                        ) : (
                            <div className="w-full h-full bg-muted/50" />
                        )
                    ) : (
                        <GeneratedAvatar
                            seed={watchedName}
                            variant="botttsNeutral"
                            className="border size-14 sm:size-16"
                        />
                    )}
                </div>
                {/* Subscription name field */}
                <FormField
                    name={"name" as any}
                    control={control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium">Name</FormLabel>
                            <FormControl>
                                <Input {...field} className="text-base sm:text-sm" placeholder="e.g., Netflix" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Category selection */}
                <FormField
                    name={"category" as any}
                    control={control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium">Category</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger className="w-full text-base sm:text-sm">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subscriptionCategoryValues.map((opt) => (
                                            <SelectItem key={opt} value={opt} className="text-base sm:text-sm">
                                                {opt.replaceAll("_", " ")}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Amount, Currency, and Billing Cycle in a grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
                    <FormField 
                        name={"amount" as any} 
                        control={control} 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Amount</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="0.00" 
                                        inputMode="decimal" 
                                        className="text-base sm:text-sm"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                    <FormField 
                        name={"currency" as any} 
                        control={control} 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Currency</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="USD" 
                                        maxLength={3} 
                                        className="text-base sm:text-sm uppercase"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                    <FormField 
                        name={"billingCycle" as any} 
                        control={control} 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Billing cycle</FormLabel>
                                <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="w-full text-base sm:text-sm">
                                            <SelectValue placeholder="Select a cycle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {billingCycleValues.map((opt) => (
                                                <SelectItem key={opt} value={opt} className="text-base sm:text-sm">
                                                    {opt.replaceAll("_", " ")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                </div>

                {/* Next billing date */}
                <FormField 
                    name={"nextBillingDate" as any} 
                    control={control} 
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium">Next billing date</FormLabel>
                            <FormControl>
                                <Input
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    type="date"
                                    className="text-base sm:text-sm"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} 
                />

                {/* Instructions textarea */}
                <FormField
                    name={"instructions" as any}
                    control={control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium">Instructions</FormLabel>
                            <FormControl>
                                <Textarea 
                                    {...field}
                                    placeholder="Add any notes or instructions..." 
                                    className="text-base sm:text-sm min-h-[100px] resize-none"
                                    rows={4}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Active and Auto Renew toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField 
                        name={"isActive" as any} 
                        control={control} 
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-md border p-3">
                                <FormLabel className="mb-0 text-sm font-medium">Active</FormLabel>
                                <FormControl>
                                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )} 
                    />
                    <FormField 
                        name={"isAutoRenew" as any} 
                        control={control} 
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-md border p-3">
                                <FormLabel className="mb-0 text-sm font-medium">Auto renew</FormLabel>
                                <FormControl>
                                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )} 
                    />
                </div>

                {/* Form action buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-2 pt-2">
                    {onCancel && (
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => onCancel()}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button 
                        disabled={isPending} 
                        type="submit"
                        className="w-full sm:w-auto"
                    >
                        {isPending ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update" : "Create")}
                    </Button>
                </div>
            </form>
        </Form>
    );
};