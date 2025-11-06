import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const showBackButton = location.pathname !== "/" && location.pathname !== "/dashboard";

  return (
    <SidebarProvider defaultOpen={false}>
      {/* AppShell: flex container with sidebar + main as siblings */}
      <div className="flex min-h-screen w-full bg-background">
        
        {/* Sidebar: Fixed 72px rail, never resizes */}
        <AppSidebar />
        
        {/* Main Content: flex-1, independent scroll */}
        <main className="flex-1 min-w-0 overflow-auto">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-3 border-b border-border bg-white/60 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-2" />
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="text-muted-foreground hover:text-foreground min-h-[44px]"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <UserMenu />
            </div>
          </div>
          
          {/* Page Content */}
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};
