"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {StarIcon, FileTextIcon, CreditCardIcon } from "lucide-react";
import { Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarFooter } from "@/components/ui/sidebar";

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
          <Link href="/" className="flex items-center gap-2">
            <Image src="/m.png" width={50} height={50} alt="KRODIT" />
            <p className="text-2xl font-bold">KRODIT</p>
          </Link>
          </SidebarHeader>
          <div className="px-2 py-1">
          <Separator className="opacity-100 text-[#878787]" />
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
                "h-10 hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border",
                pathname === item.href && "bg-sidebar-accent border-sidebar-border"
              )}
              isActive={pathname === item.href}
            >
              <Link href={item.href} className="flex items-center gap-2">
                <item.icon/>
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
          <Separator className="opacity-100 text-[#878787]" />
        </div>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        {secondSection.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              className={cn(
                "h-10 hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border",
                pathname === item.href && "bg-sidebar-accent border-sidebar-border"
              )}
              isActive={pathname === item.href}
            >
              <Link href={item.href} className="flex items-center gap-2">
                <item.icon/>
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
      <DashboardUserButton/>
    </SidebarFooter>
    </Sidebar>
  );
};
