import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebar-open");
    return stored ? JSON.parse(stored) : false;
  });

  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== "/" && location.pathname !== "/dashboard";

  useEffect(() => {
    localStorage.setItem("sidebar-open", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Custom Sidebar */}
      <AppSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content - margin matches sidebar width */}
      <main 
        className={cn(
          "flex-1 min-w-0 overflow-auto transition-all duration-300",
          sidebarOpen ? "ml-[260px]" : "ml-[72px]"
        )}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-3 border-b border-border bg-white/60 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
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
  );
};
