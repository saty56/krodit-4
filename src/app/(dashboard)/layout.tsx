import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import RequireAuth from "@/modules/dashboard/ui/components/auth/require-auth";
import DashboardNavbar from "@/modules/dashboard/ui/components/dashboartd-navbar";
import { ReminderChecker } from "@/modules/dashboard/ui/components/reminder-checker";
import { SidebarFullscreenHandler } from "@/components/sidebar-fullscreen-handler";


interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <SidebarFullscreenHandler />
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