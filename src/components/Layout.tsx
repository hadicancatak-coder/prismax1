import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";

export const Layout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" />
            <div className="flex items-center gap-4 ml-auto">
              <NotificationBell />
              <UserMenu />
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};
