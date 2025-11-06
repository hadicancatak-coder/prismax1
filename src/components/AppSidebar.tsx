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
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar 
} from "@/components/ui/sidebar";
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

export function AppSidebar() {
  const { open, setOpen } = useSidebar();
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
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, setOpen]);

  return (
    <TooltipProvider delayDuration={150}>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarContent className="bg-[#0B1220] border border-white/8 m-4 rounded-xl">
          {/* Logo/Brand */}
          <div className={cn(
            "flex items-center gap-3 px-6 py-6",
            !open && "justify-center px-4"
          )}>
            <img src={logoImage} alt="CFI" className={cn("flex-shrink-0", open ? "h-10" : "h-8")} />
            {open && (
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold text-sm truncate">Prisma</span>
                {userName && <span className="text-[#9CA3AF] text-xs truncate">{userName}</span>}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className={cn("border-t border-white/8 mb-4", open ? "mx-4" : "mx-4")} />

          {/* Core Navigation */}
          <SidebarGroup>
            {open && (
              <SidebarGroupLabel className="text-white/60 px-6 text-xs">
                Core
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className={cn("space-y-2", open ? "px-3" : "px-3")}>
                {coreItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 px-3 py-2 h-10 rounded-lg transition-all",
                                isActive
                                  ? "bg-[#CF0A0A] text-white font-medium"
                                  : "text-[#E5E7EB] hover:bg-white/10 hover:text-white",
                                !open && "justify-center"
                              )
                            }
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
                            {open && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!open && (
                        <TooltipContent 
                          side="right" 
                          sideOffset={12}
                          className="bg-black/90 text-white border-0 shadow-xl px-3 py-2 rounded-md text-xs"
                        >
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Separator */}
          <div className={cn("border-t border-white/8 my-4", open ? "mx-4" : "mx-4")} />

          {/* Operations Navigation */}
          <SidebarGroup>
            {open && (
              <SidebarGroupLabel className="text-white/60 px-6 text-xs">
                Operations
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className={cn("space-y-2", open ? "px-3" : "px-3")}>
                {operationsItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 px-3 py-2 h-10 rounded-lg transition-all",
                                isActive
                                  ? "bg-[#CF0A0A] text-white font-medium"
                                  : "text-[#E5E7EB] hover:bg-white/10 hover:text-white",
                                !open && "justify-center"
                              )
                            }
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
                            {open && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!open && (
                        <TooltipContent 
                          side="right" 
                          sideOffset={12}
                          className="bg-black/90 text-white border-0 shadow-xl px-3 py-2 rounded-md text-xs"
                        >
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom divider */}
          <div className={cn("border-t border-white/8 my-4", open ? "mx-4" : "mx-4")} />

          {/* Sign Out at bottom */}
          <div className="px-3 pb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={signOut}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 h-10 rounded-lg transition-all text-[#E5E7EB] hover:bg-white/10 hover:text-[#CF0A0A] w-full",
                    !open && "justify-center"
                  )}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
                  {open && <span className="text-sm">Sign Out</span>}
                </button>
              </TooltipTrigger>
              {!open && (
                <TooltipContent 
                  side="right" 
                  sideOffset={12}
                  className="bg-black/90 text-white border-0 shadow-xl px-3 py-2 rounded-md text-xs"
                >
                  Sign Out
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
