import { ResponsiveDialog } from "@/components/responsive-dialog";
import { SubscriptionForm } from "./subscription-form";

interface NewSubscriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NewSubscriptionDialog = ({ 
    open, 
    onOpenChange 
}: NewSubscriptionDialogProps) => {
    return (
        <ResponsiveDialog 
        title="New Subscription"
         description="Add a new subscription"
         open={open} onOpenChange={onOpenChange}
          >
             <SubscriptionForm 
             onSuccess={()=> onOpenChange(false)}
             onCancel={() => onOpenChange(false)} 
             /> 
        </ResponsiveDialog>
    );
}; 