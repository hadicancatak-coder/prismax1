import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Plus, Sun, Moon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function TopHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Get current page name for breadcrumb
  const getPageName = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "Dashboard";
    if (path === "/tasks") return "Tasks";
    if (path === "/calendar") return "Agenda";
    if (path === "/utm-planner") return "UTM Planner";
    if (path.includes("/ads")) return "Ads";
    if (path.includes("/operations")) return "Operations";
    return "Prisma";
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 mx-4 mt-4 rounded-2xl",
        "backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.10)]",
        "transition-all duration-200",
        theme === "light" 
          ? "bg-white/70 border border-white/40" 
          : "bg-card/70 border border-white/10"
      )}
    >
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-3">
        {/* Left Side - Sidebar trigger & Breadcrumb */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all h-9 w-9" />
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">Prisma</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{getPageName()}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn(
              "h-9 w-9 rounded-full transition-all",
              "hover:bg-muted"
            )}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* Create Button with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className={cn(
                  "gap-1.5 rounded-full px-4 h-9",
                  "bg-primary hover:bg-primary-hover text-primary-foreground",
                  "shadow-sm transition-all"
                )}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">Create</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className={cn(
                "w-48 rounded-xl border-border",
                "bg-popover shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
              )}
            >
              <DropdownMenuItem 
                onClick={() => navigate("/tasks")}
                className="gap-2 rounded-lg"
              >
                📋 New Task
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate("/operations/status-log")}
                className="gap-2 rounded-lg"
              >
                📝 Status Log
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate("/ads/search")}
                className="gap-2 rounded-lg"
              >
                📢 Search Campaign
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate("/utm-planner")}
                className="gap-2 rounded-lg"
              >
                🔗 UTM Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
