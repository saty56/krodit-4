"use client"

import { ColumnDef } from "@tanstack/react-table"
import { SubscriptionListOne } from "../../types"
import { GeneratedAvatar } from "@/components/gen-avatar"
import { CornerDownRightIcon, CreditCardIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import React from "react"
import { getLogoUrlViaApi } from "@/lib/logo-api"
import { fallbackIconUrls } from "@/lib/logos"
import { useMemo } from "react";

function LogoByName({ name }: { name: string }) {
  const [src, setSrc] = React.useState<string>("");
  React.useEffect(() => {
    let mounted = true;
    const q = String(name || "").trim();
    if (!q) { setSrc(""); return; }
    getLogoUrlViaApi(q).then((url) => {
      if (!mounted) return;
      if (url) setSrc(url);
      else {
        const fb = fallbackIconUrls(q, 64);
        setSrc(fb[0] || "");
      }
    });
    return () => { mounted = false; };
  }, [name]);

  if (!name) return (
    <GeneratedAvatar variant="botttsNeutral" seed={name} className="size-6" />
  );

  if (!src) return (
    <div className="size-6 rounded bg-muted" />
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="size-6 rounded"
      onError={(e)=>{
        const el = e.currentTarget as HTMLImageElement;
        const fallbacks = fallbackIconUrls(name, 64);
        const idx = Number(el.dataset.fbIndex || 0);
        if (idx < fallbacks.length) {
          el.dataset.fbIndex = String(idx + 1);
          el.src = fallbacks[idx];
        } else {
          el.onerror = null;
        }
      }}
    />
  );
}

export const columns: ColumnDef<SubscriptionListOne>[] = [
  {
    accessorKey: "name",
    header: "Subscription Name",
    cell: ({ row }) =>(
        <div className="flex flex-col gap-y-1">
            <div className="flex items-center gap-x-2">
                <LogoByName name={row.original.name} />
                <span className="font-semibold capitalize">{row.original.name}
                </span>
            </div>
            <div className="flex items-center gap-x-2">
                <CornerDownRightIcon className="size-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground max-w-[520px] truncate">
                    {(() => {
                      const rawAmount = (row.original as any).amount ?? "0.00";
                      const currency = (row.original as any).currency ?? "USD";
                      const d = (row.original as any).nextBillingDate as Date | string | undefined;
                      const date = d ? (typeof d === "string" ? new Date(d) : d) : undefined;
                      let amountStr = String(rawAmount);
                      try {
                        const num = parseFloat(String(rawAmount));
                        amountStr = new Intl.NumberFormat(undefined, { style: "currency", currency }).format(isFinite(num) ? num : 0);
                      } catch {}
                      const dateStr = date && !isNaN(date.getTime()) ? date.toLocaleDateString() : "";
                      const parts = [dateStr, amountStr, row.original.instructions || ""].filter(Boolean);
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