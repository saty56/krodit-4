import { ResponsiveDialog } from "@/components/responsive-dialog";
import { SubscriptionForm } from "./subscription-form";

/**
 * Props for NewSubscriptionDialog component
 */
interface NewSubscriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for creating a new subscription
 * Wraps SubscriptionForm in a responsive dialog (drawer on mobile, dialog on desktop)
 */
export const NewSubscriptionDialog = ({ 
    open, 
    onOpenChange 
}: NewSubscriptionDialogProps) => {
    return (
        <ResponsiveDialog 
            title="New Subscription"
            description="Add a new subscription"
            open={open} 
            onOpenChange={onOpenChange}
        >
            <SubscriptionForm 
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)} 
            /> 
        </ResponsiveDialog>
    );
}; 