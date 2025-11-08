import Link from "next/link";
import { TrashIcon, PencilIcon, MoreVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Props {
    subscriptionId: string;
    subscriptionName: string;
    onEdit: () => void;
    onRemove: () => void;
}

export const SubscriptionIdViewHeader = ({
    subscriptionId,
    subscriptionName,
    onEdit,
    onRemove,
}: Props) => {
    return (
        <div className="flex items-center justify-between">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild className="font-medium text-xl">
                       <Link href="/subscriptions">
                        My Subscriptions
                        </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild className="font-medium text-xl text-foreground">
                        <Link href={`/subscriptions/${subscriptionId}`}>
                        {subscriptionName}
                        </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            {/* Without modal={false}, the dialog that this dropdown opens cause the website to get 
            unclickable */}
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                        <MoreVerticalIcon/>
                    </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <PencilIcon className="size-4 text-blue-600 dark:text-blue-400" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRemove}>
                  <TrashIcon className="size-4 text-blue-600 dark:text-blue-400" />
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            </div>
    );
};
