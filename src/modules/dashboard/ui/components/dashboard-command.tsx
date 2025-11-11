import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";
import {
  CommandResponsiveDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command";
import { useTRPC } from "@/trpc/client";
import { LogoByName } from "@/components/logo-by-name";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
  const router =useRouter();
  const [search, setSearch] = useState("");

  const trpc = useTRPC();
  const subscriptions = useQuery(
    trpc.subscriptions.listMany.queryOptions({
      search,
      pageSize: 100,
    })
  );


  return (
    <CommandResponsiveDialog shouldFilter={false} open={open} onOpenChange={setOpen}>
      <CommandInput 
       placeholder="Find a subscription..." 
       value={search}
       onValueChange={(value) => setSearch(value)}/>
      <CommandList>
        <CommandGroup heading="Subscriptions">
          <CommandEmpty>
            <span className="text-muted-foreground text-sm">
              No subscriptions found
            </span>
          </CommandEmpty>
          {subscriptions.data?.items.map((subscription) => (
            <CommandItem
            onSelect={() => {
              router.push(`/subscriptions/${subscription.id}`);
              setOpen(false);
            }}
            key={subscription.id}
            >
              <div className="flex items-center gap-x-2">
                <LogoByName name={subscription.name} className="size-5" />
                <span>{subscription.name}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandResponsiveDialog>
  );
};

