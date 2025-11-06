import { FloatingSidebar } from "@/components/FloatingSidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const showBackButton = location.pathname !== "/" && location.pathname !== "/dashboard";

  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      <FloatingSidebar />
      <main className="flex-1 overflow-auto w-full ml-[88px]">
        <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-3 border-b border-border bg-white/60 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
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
        <Outlet />
      </main>
    </div>
  );
};
