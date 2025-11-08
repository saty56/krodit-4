"use client"

import { ColumnDef } from "@tanstack/react-table"
import { SubscriptionListOne } from "../../types"
import { CornerDownRightIcon, CreditCardIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { LogoByName } from "@/components/logo-by-name"
import { formatCurrency, formatDate } from "@/lib/format-utils"

export const columns: ColumnDef<SubscriptionListOne>[] = [
  {
    accessorKey: "name",
    header: "Subscription Name",
    cell: ({ row }) =>(
        <div className="flex flex-col gap-y-1">
            <div className="flex items-center gap-x-2">
                <LogoByName name={row.original.name} className="size-6" />
                <span className="font-semibold capitalize">{row.original.name}
                </span>
            </div>
            <div className="flex items-center gap-x-2">
                <CornerDownRightIcon className="size-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground max-w-[520px] truncate">
                    {(() => {
                      const amount = (row.original as any).amount ?? "0.00";
                      const currency = (row.original as any).currency ?? "USD";
                      const nextBillingDate = (row.original as any).nextBillingDate;
                      const instructions = row.original.instructions || "";
                      
                      const parts = [
                        formatDate(nextBillingDate) !== "-" ? formatDate(nextBillingDate) : "",
                        formatCurrency(amount, currency),
                        instructions
                      ].filter(Boolean);
                      
                      return parts.join(" • ");
                    })()}
                </span>
            </div>
         </div>
    )
},
{
    id: "billing",
    header: "Billing",
    cell: ({ table }) => {
        // Count active subscriptions from all data rows
        const allRows = table.getRowModel().rows.map(r => r.original);
        const activeCount = allRows.filter((x:any) => x.isActive).length;
        return (
            <div className="flex flex-col items-center gap-y-1">
                <Badge variant="outline" className="flex items-center gap-x-2 [&>svg]:size-4">
                    <CreditCardIcon className="text-red-700" />
                    <span className="text-xs text-muted-foreground mt-0.5">{activeCount} active</span>
                </Badge>
            </div>
        );
    }
},
];