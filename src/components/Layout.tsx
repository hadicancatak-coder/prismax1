import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";

export const Layout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-end px-6 py-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10 shadow-sm">
            <NotificationBell />
          </div>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};
