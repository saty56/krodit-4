"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {StarIcon, FileTextIcon, CreditCardIcon } from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarFooter } from "@/components/ui/sidebar";

import { DashboardTrial } from "./dashboard-trial";
import { DashboardUserButton } from "./dashboard-user-button";

const firstSection = [
  {
    icon: CreditCardIcon,
    label: "Subscriptions",
    href: "/subscriptions",
  },
  {
    icon: FileTextIcon,
    label: "Report",
    href: "/report",
  },
];

const secondSection = [
  {
    icon: StarIcon,
    label: "Upgrade",
    href: "/upgrade",
  },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-accent-foreground">
          <Link href="/" className="flex items-center gap-2 px-2 pt-2">
            <Image src="/file.svg" width={46} height={46} alt="KRODIT" />
            <p className="text-2xl font-semibold">KRODIT</p>
          </Link>
          </SidebarHeader>
          <div className="px-2 py-2">
          <Separator className="opacity-20 bg-white/80" />
        </div>
        <SidebarContent>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        {firstSection.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              className={cn(
                "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-white/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50", 
              
              pathname === item.href && "bg-linear-to-r/oklch border-white/10")}
              isActive={pathname === item.href}
            >
              <Link href={item.href} className={cn(
                "flex items-center gap-2 text-white/90",
                pathname === item.href && "text-white font-semibold"
              )}>
                <item.icon className="size-5"/>
                <span className="text-sm font-medium tracking-tight">
                  {item.label}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
  <div className="px-2 py-1">
          <Separator className="opacity-20 bg-white/80" />
        </div>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        {secondSection.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
                asChild
                className={cn(
                  "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-white/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50", 
                
                pathname === item.href && "bg-linear-to-r/oklch border-white/10")}
                isActive={pathname === item.href}
              >
                <Link href={item.href} className={cn(
                  "flex items-center gap-2 text-white/90",
                  pathname === item.href && "text-white font-semibold"
                )}>
                  <item.icon className="size-5"/>
                  <span className="text-sm font-medium tracking-tight">
                    {item.label}
                  </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
    </SidebarGroup>
    </SidebarContent>
    <SidebarFooter className="text-sidebar-foreground px-2 py-2">
      <DashboardTrial />
      <DashboardUserButton/>
    </SidebarFooter>
    </Sidebar>
  );  
};
