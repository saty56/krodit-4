import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import RequireAuth from "@/modules/dashboard/ui/components/auth/require-auth";
import DashboardNavbar from "@/modules/dashboard/ui/components/dashboartd-navbar";
import { ReminderChecker } from "@/modules/dashboard/ui/components/reminder-checker";


interface Props {
  children: React.ReactNode;
}

const Layout = async ({ children }: Props) => {
  // Server-side auth check - redirect immediately if not authenticated
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <DashboardSidebar /> 
      <SidebarInset className="flex flex-col h-screen w-full max-w-full bg-muted overflow-hidden">
        <DashboardNavbar />
        <RequireAuth>
          <ReminderChecker />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </RequireAuth>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;