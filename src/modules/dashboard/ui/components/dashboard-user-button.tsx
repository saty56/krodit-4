import React from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "@/components/gen-avatar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger
} from "@/components/ui/drawer";


export const DashboardUserButton = () => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data, isPending } = authClient.useSession();

  // Debug: log user data to see if image is present
  React.useEffect(() => {
    if (data?.user) {
      console.log('User data:', {
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
      });
    }
  }, [data]);

  const onLogout = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in"); // redirect after logout
        },
      },
    });
  };

 if (isPending || !data?.user) {
    return null;
  }

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger 
        className="rounded-lg border border-white/30 p-3 w-full flex items-center justify-between bg-white/10 hover:bg-white/15 dark:bg-white/10 dark:hover:bg-white/15 overflow-hidden gap-x-2 text-white">
        {data.user.image ? (
             <Avatar>
              <AvatarImage 
                src={data.user.image} />
                </Avatar>
            ) : (
              <GeneratedAvatar
                seed={data.user.name}
                variant="initials"
                className="size-9 mr-3"
              />
            )}
          <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
             <p className="text-sm truncate w-full text-white">
                  {data.user.name}
              </p>
             <p className="text-xs truncate w-full text-white/70">
                  {data.user.email}
             </p>
           </div>
           <ChevronDownIcon className="size-4 shrink-0 text-white/80" />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{data.user.name}</DrawerTitle>
            <DrawerDescription>{data.user.email}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button 
            variant="outline"
            onClick={() => {}}
            > 
             <CreditCardIcon className="size-4 text-muted-foreground" />
             Billing
            </Button>
            <Button 
            variant="outline"
            onClick={onLogout}
            > 
             <LogOutIcon className="size-4 text-muted-foreground" />
             Logout
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
 

  return (
    <DropdownMenu>
    <DropdownMenuTrigger className="rounded-lg border border-border/10 p-3 w-full 
    flex items-center justify-between bg-white/10 hover:bg-white/10 overflow-hidden gap-x-2">
    {data.user.image ? (
         <Avatar className="size-9 mr-3">
              <AvatarImage src={data.user.image} />
                </Avatar>
    ) : (
            <GeneratedAvatar
              seed={data.user.name}
              variant="initials"
              className="size-9 mr-3"
            />
    )}
      
        <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
           <p className="text-sm truncate w-full text-white">
                {data.user.name}
            </p>
           <p className="text-xs truncate w-full text-white/70">
                {data.user.email}
           </p>
         </div>
         <ChevronDownIcon className="size-4 shrink-0 text-white/80" />
       </DropdownMenuTrigger>
         <DropdownMenuContent align="end" side="right" className="w-72">
          <DropdownMenuLabel>
           <div className="flex flex-col gap-1">
           <span className="font-medium truncate">{data.user.name}</span>
           <span className="text-sm font-normal text-muted-foreground truncate">
            {data.user.email}
            </span>
           </div>
        </DropdownMenuLabel>
          <DropdownMenuSeparator />
             <DropdownMenuItem 
               className="cursor-pointer flex items-center justify-between"
             >
                   Billing
                 <CreditCardIcon className="size-4" />
                 </DropdownMenuItem>
               <DropdownMenuItem 
                onClick={onLogout}
                className="cursor-pointer flex items-center justify-between">
                                   Logout
              <LogOutIcon className="size-4" />
             </DropdownMenuItem> 
            </DropdownMenuContent>
      </DropdownMenu>
    );
}; 