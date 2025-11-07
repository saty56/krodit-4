import { ResponsiveDialog } from "@/components/responsive-dialog";
import { SubscriptionForm } from "./subscription-form";
import { SubscriptionListOne } from "../../types";

interface UpdateSubscriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues: SubscriptionListOne;
}

export const UpdateSubscriptionDialog = ({ 
    open, 
    onOpenChange,
    initialValues
}: UpdateSubscriptionDialogProps) => {
    return (
        <ResponsiveDialog 
        title="Edit Subscription"
         description="Edit subscription details"
         open={open} onOpenChange={onOpenChange}
          >
             <SubscriptionForm 
             onSuccess={()=> onOpenChange(false)}
             onCancel={() => onOpenChange(false)} 
             initialValues={initialValues}
             /> 
        </ResponsiveDialog>
    );
};