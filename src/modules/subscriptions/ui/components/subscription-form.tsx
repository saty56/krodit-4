import React from "react";
import { z } from "zod"
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
    SelectValue } from "@/components/ui/select";


interface SubscriptionFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: SubscriptionListOne;
}

    export const SubscriptionForm = ({
        onSuccess,
        onCancel,
        initialValues,
    }: SubscriptionFormProps) => {
        const trpc = useTRPC();
        const queryClient = useQueryClient(); 

        const createSubscription = useMutation(
            trpc.subscriptions.create.mutationOptions({
                onSuccess: async () => {
                   await queryClient.invalidateQueries(
                    trpc.subscriptions.listMany.queryOptions({})
                   );

                    if (initialValues?.id) {
                       await queryClient.invalidateQueries(
                         trpc.subscriptions.listOne.queryOptions({ id: initialValues.id }),
                        )
                    }  
                    onSuccess?.();
                },
                onError: (error) => { 
                    toast.error(error.message);

                    // TODO: Check if error code is "FORBIDDEN", redirect to "/upgrade"
                },
            }),
        );
     
        type FormValues = z.infer<typeof subscriptionsInsertschema>;
        const form = useForm<FormValues>({
            resolver: zodResolver(subscriptionsInsertschema) as any,
            defaultValues: {
                name: initialValues?.name ?? "",
                instructions: (initialValues as any)?.instructions ?? "",
                category: (initialValues as any)?.category ?? "other",
                amount: (initialValues as any)?.amount ?? "0.00",
                currency: (initialValues as any)?.currency ?? "USD",
                billingCycle: (initialValues as any)?.billingCycle ?? "monthly",
                nextBillingDate: (() => {
                  const raw = (initialValues as any)?.nextBillingDate as any;
                  if (!raw) return "";
                  const d = raw instanceof Date ? raw : new Date(raw);
                  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
                })(),
                isActive: (initialValues as any)?.isActive ?? true,
                isAutoRenew: (initialValues as any)?.isAutoRenew ?? true,
            } as any,
        });
		const control = form.control as any;

		// Logo fetch based on name (prefer Brandfetch via API)
		const watchedName = form.watch("name") || "";
		const [logoSrc, setLogoSrc] = React.useState<string>("");
		const [logoLoading, setLogoLoading] = React.useState<boolean>(false);
		React.useEffect(() => {
			let active = true;
			const q = String(watchedName || "").trim();
			if (!q) { setLogoSrc(""); setLogoLoading(false); return; }
			setLogoLoading(true);
			getLogoUrlViaApi(q).then((url) => {
				if (!active) return;
				if (url) {
					setLogoSrc(url);
				} else {
					const fb = fallbackIconUrls(q, 128);
					setLogoSrc(fb[0] || "");
				}
			}).finally(() => { if (active) setLogoLoading(false); });
			return () => { active = false; };
		}, [watchedName]);

        const isEdit = !!initialValues?.id;
        const isPending = createSubscription.isPending;

        const onSubmit: SubmitHandler<FormValues> = (values) => {
            if (isEdit) {
                console.log("TODO: updateSubscription");
            } else {
                createSubscription.mutate(values);
            }
        };

        return (
            <Form {...(form as any)}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
					<div className="border size-16 rounded-md overflow-hidden flex items-center justify-center bg-muted/20">
						{watchedName ? (
							logoSrc ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
									src={logoSrc}
									alt={watchedName || "Service logo"}
								className="w-full h-full object-contain"
								onError={(e)=>{
									const el = e.currentTarget as HTMLImageElement;
									const fallbacks = fallbackIconUrls(watchedName, 128);
									const idx = Number(el.dataset.fbIndex || 0);
									if (idx < fallbacks.length) {
										el.dataset.fbIndex = String(idx + 1);
										el.src = fallbacks[idx];
									} else {
										el.onerror = null;
									}
								}}
							/>
							) : (
								<div className="w-full h-full animate-pulse bg-muted" />
							)
						) : (
							<GeneratedAvatar
								seed={watchedName}
								variant="botttsNeutral"
								className="border size-16"
							/>
						)}
					</div>
                 <FormField
                 name={"name" as any}
                 control={control}
                 render={({field}) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                 )}
                 />
                 <FormField
                 name={"category" as any}
                 control={control}
                 render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {subscriptionCategoryValues.map((opt) => (
                              <SelectItem key={opt} value={opt}>
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
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   <FormField name={"amount" as any} control={control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="0.00" inputMode="decimal" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                   )} />
                   <FormField name={"currency" as any} control={control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="USD" maxLength={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                   )} />
                   <FormField name={"billingCycle" as any} control={control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing cycle</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a cycle" />
                            </SelectTrigger>
                            <SelectContent>
                              {billingCycleValues.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt.replaceAll("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                   )} />
                 </div>
                 <FormField name={"nextBillingDate" as any} control={control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next billing date</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          type="date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                 )} />
                 <FormField
                 name={"instructions" as any}
                 control={control}
                 render={({field}) => (
                    <FormItem>
                        <FormLabel>Instructions</FormLabel>
                        <FormControl>
                            <Textarea {...field}
                            placeholder="you are amazing" />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                 )}
                 />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <FormField name={"isActive" as any} control={control} render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel className="mb-0">Active</FormLabel>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                   )} />
                   <FormField name={"isAutoRenew" as any} control={control} render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel className="mb-0">Auto renew</FormLabel>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                   )} />
                 </div>
                 <div className="flex justify-between gap-x-2">
                    {onCancel && (
                        <Button
                        variant="ghost"
                        type="button"
                        onClick={() => onCancel()}  
                    >
                        Cancel
                        </Button>            
                         )}
                         <Button disabled={isPending} type="submit">
                            {isEdit ? "Update" : "Create"}
                         </Button>
                 </div>
                </form>
            </Form>
        );
    }