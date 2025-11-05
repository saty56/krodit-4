import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import RequireAuth from "@/modules/dashboard/ui/components/auth/require-auth";
import DashboardNavbar from "@/modules/dashboard/ui/components/dashboartd-navbar";


interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <DashboardSidebar /> 
      <SidebarInset className="flex flex-col h-screen bg-muted">
        <DashboardNavbar />
        <RequireAuth>
          {children}
        </RequireAuth>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;