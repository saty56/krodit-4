import { ResponsiveDialog } from "@/components/responsive-dialog";
import { SubscriptionForm } from "./subscription-form";
import { SubscriptionListOne } from "../../types";

/**
 * Props for UpdateSubscriptionDialog component
 */
interface UpdateSubscriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues: SubscriptionListOne;
}

/**
 * Dialog component for editing an existing subscription
 * Wraps SubscriptionForm in a responsive dialog (drawer on mobile, dialog on desktop)
 */
export const UpdateSubscriptionDialog = ({ 
    open, 
    onOpenChange,
    initialValues
}: UpdateSubscriptionDialogProps) => {
    return (
        <ResponsiveDialog 
            title="Edit Subscription"
            description="Edit subscription details"
            open={open} 
            onOpenChange={onOpenChange}
        >
            <SubscriptionForm 
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)} 
                initialValues={initialValues}
            /> 
        </ResponsiveDialog>
    );
};