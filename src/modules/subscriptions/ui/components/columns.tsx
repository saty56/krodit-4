"use client"

import { ColumnDef } from "@tanstack/react-table"
import { SubscriptionListOne } from "../../types"
import { GeneratedAvatar } from "@/components/gen-avatar"
import { CornerDownRightIcon, CreditCardIcon, SubscriptIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const columns: ColumnDef<SubscriptionListOne>[] = [
  {
    accessorKey: "name",
    header: "Subscription Name",
    cell: ({ row }) =>(
        <div className="flex flex-col gap-y-1">
            <div className="flex items-center gap-x-2">
                <GeneratedAvatar 
                  variant="botttsNeutral"
                  seed={row.original.name}
                  className="size-6"
                />
                <span className="font-semibold capitalize">{row.original.name}
                </span>
            </div>
            <div className="flex items-center gap-x-2">
                <CornerDownRightIcon className="size-3 text-muted-foreground" />
                <span className="text-sm text-muted- foreground max-w-[200px] truncate capitalize">
                    {row.original.instructions}
                </span>
            </div>
         </div>
    )
},
{
    accessorKey: "subscriptionCount",
    header: "Subscriptions",
    cell: ({ row }) => (
        <Badge 
        variant="outline"
        className="flex items-center gap-x-2 [&>svg]:size-4"
        >
            <CreditCardIcon className="text-red-700" />
            {row.original.subscriptioncount} {row.original.subscriptionCount === 1 ? "subscription" : "subscriptions"}
        </Badge>
    )
}
]