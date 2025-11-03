import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useTRPC } from "@/trpc/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedAvatar } from "@/components/gen-avatar";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { SubscriptionListOne } from "../../types";
import { subscriptionsInsertschema } from "../../schema";
import { toast } from "sonner";


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
                        trpc.subscriptions.list.queryOptions()
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
     
        const form = useForm<z.infer<typeof subscriptionsInsertschema>>({
            resolver: zodResolver(subscriptionsInsertschema),
            defaultValues: {
                name: initialValues?.name ?? "",
                instructions: (initialValues as any)?.instructions ?? "",
            },
        });

        const isEdit = !!initialValues?.id;
        const isPending = createSubscription.isPending;

        const onSubmit = (values: z.infer<typeof subscriptionsInsertschema>) => {
            if (isEdit) {
                console.log("TODO: updateSubscription");
            } else {
                createSubscription.mutate(values);
            }
        };

        return (
            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <GeneratedAvatar
                    seed={form.watch("name")}
                    variant="botttsNeutral"
                    className="border size-16"
                    />
                 <FormField
                 name="name"
                 control={form.control}
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
                 name="instructions"
                 control={form.control}
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