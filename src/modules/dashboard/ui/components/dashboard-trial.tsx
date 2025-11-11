import Link from "next/link";
import { RocketIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const DashboardTrial = () => {
    const trpc = useTRPC();
	const { data } = useQuery({
		...trpc.premium.getFreeUsage.queryOptions(),
		refetchInterval: 1000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		staleTime: 0,
	});

    // Don't show component if user has Business plan (unlimited) or unknown premium plan
    if (!data) return null;

    const { subscriptionCount, planType, maxSubscriptions } = data;
    
    // Determine title and button text based on plan type
    const title = planType === "pro" ? "Pro Plan" : "Free Trial";
    const buttonText = planType === "pro" ? "Upgrade to Business" : "Upgrade";

    return (
        <div className="border border-border/10 rounded-lg w-full bg-white/10 flex flex-col gap-y-2">
          <div className="p-3 flex flex-col gap-y-4">
            <div className="flex items-center gap-2">
              <RocketIcon className="size-4" />
              <p className="text-sm font-medium">{title}</p>
           </div>
           <div className="flex flex-col gap-y-2">
             <p className="text-xs">
                {subscriptionCount}/{maxSubscriptions} Subscriptions
             </p>
             <Progress value={(subscriptionCount / maxSubscriptions) * 100} />
           </div>
         </div>
         <Button 
         className="bg-transparent border-t border-border/10 hover:bg-white/10 rounded-t-none"
          asChild
         >
          <Link href="/upgrade">          
            {buttonText}
            </Link>
         </Button>
        </div>
    );
};