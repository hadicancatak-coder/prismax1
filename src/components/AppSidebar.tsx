import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  FileText,
  Megaphone,
  PenTool,
  Link2,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/cfi-logo.png";

const coreItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Agenda", url: "/calendar", icon: Calendar },
];

const operationsItems = [
  { title: "Audit Logs", url: "/operations", icon: FileText },
  { title: "PPC Planner", url: "/ads", icon: Megaphone },
  { title: "Copy Planner", url: "/copywriter", icon: PenTool },
  { title: "UTM Planner", url: "/utm-planner", icon: Link2 },
];

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const { signOut, user } = useAuth();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data?.name) {
        setUserName(data.name);
      } else {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || "User");
      }
    }

    fetchProfile();
  }, [user]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onToggle();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onToggle]);

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border shadow-sm transition-all duration-[150ms] ease-in-out z-40",
          isOpen ? "w-[260px]" : "w-[72px]"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className={cn(
            "flex items-center gap-3 px-4 py-6 border-b border-sidebar-border",
            !isOpen && "justify-center px-0"
          )}>
            <img src={logoImage} alt="CFI" className="h-8 flex-shrink-0" />
            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-sidebar-foreground font-semibold text-sm tracking-tight truncate">Prisma</span>
                {userName && <span className="text-sidebar-foreground/60 text-xs truncate">{userName}</span>}
              </div>
            )}
          </div>

          {/* Core Navigation */}
          <div className="py-4">
            {isOpen && (
              <div className="px-4 mb-2">
                <span className="text-sidebar-foreground/60 text-xs font-medium uppercase tracking-wider">Core</span>
              </div>
            )}
            <nav className="space-y-0.5 px-3">
              {coreItems.map((item) => (
                <Tooltip key={item.url}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                          isActive
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                          !isOpen && "justify-center"
                        )
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
                      {isOpen && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </TooltipTrigger>
                  {!isOpen && (
                    <TooltipContent 
                      side="right" 
                      sideOffset={12}
                      className="bg-popover text-popover-foreground border shadow-md"
                    >
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </nav>
          </div>

          {/* Separator */}
          <div className="border-t border-sidebar-border mx-3" />

          {/* Operations Navigation */}
          <div className="py-4">
            {isOpen && (
              <div className="px-4 mb-2">
                <span className="text-sidebar-foreground/60 text-xs font-medium uppercase tracking-wider">Operations</span>
              </div>
            )}
            <nav className="space-y-0.5 px-3">
              {operationsItems.map((item) => (
                <Tooltip key={item.url}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                          isActive
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                          !isOpen && "justify-center"
                        )
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
                      {isOpen && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </TooltipTrigger>
                  {!isOpen && (
                    <TooltipContent 
                      side="right" 
                      sideOffset={12}
                      className="bg-popover text-popover-foreground border shadow-md"
                    >
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </nav>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom divider */}
          <div className="border-t border-sidebar-border mx-3" />

          {/* Sign Out at bottom */}
          <div className="px-3 py-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={signOut}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive w-full",
                    !isOpen && "justify-center"
                  )}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
                  {isOpen && <span className="text-sm font-medium">Sign Out</span>}
                </button>
              </TooltipTrigger>
              {!isOpen && (
                <TooltipContent 
                  side="right" 
                  sideOffset={12}
                  className="bg-popover text-popover-foreground border shadow-md"
                >
                  Sign Out
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
