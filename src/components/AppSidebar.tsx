import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckSquare, Calendar, LayoutDashboard as DashboardIcon, LogOut, Megaphone, Target, Bell, FolderKanban, Link2, Share2, FileText, PenTool, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/cfi-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const coreItems = [
  { title: "Dashboard", url: "/", icon: DashboardIcon },
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
  const { open, setOpen, toggleSidebar } = useSidebar();
  const { signOut, userRole, user } = useAuth();
  const [userName, setUserName] = useState<string>("");

  const isExpanded = open;

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.name) {
            setUserName(data.name);
          } else {
            setUserName(user.user_metadata?.name || user.email?.split('@')[0] || "User");
          }
        });
    }
  }, [user]);

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base = `flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-lg relative transition-all duration-150 ease-in-out`;
    
    if (isActive) {
      // When expanded: show red line on left
      // When collapsed: show background highlight instead
      if (isExpanded) {
        return `${base} text-white font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-8 before:bg-[#CF0A0A] before:rounded-r`;
      } else {
        return `${base} text-white font-medium bg-white/10`;
      }
    }
    
    return `${base} text-[#E5E7EB] font-normal hover:bg-white/5 hover:text-white`;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar 
        collapsible="icon" 
        className="h-screen border-r border-border/40 backdrop-blur-sm transition-all duration-300 ease-in-out"
        style={{ background: 'rgba(11, 18, 32, 0.95)' }}
      >
        <SidebarContent className={`${isExpanded ? 'px-4 py-8 space-y-8' : 'px-2 py-6 space-y-6'}`}>
          {/* Logo */}
          <div className={`flex ${isExpanded ? 'items-center gap-3 px-3 pb-6' : 'flex-col items-center justify-center pb-4'}`}>
            <img 
              src={logoImage} 
              alt="Prisma" 
              className={`transition-all duration-150 ease-in-out ${isExpanded ? 'h-10' : 'h-8'}`}
            />
            {isExpanded && (
              <div className="flex flex-col">
                <span className="text-section-title text-white font-semibold">Prisma</span>
                {userName && (
                  <span className="text-metadata text-[#9CA3AF] mt-0.5">
                    {userName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Core Features */}
          <SidebarGroup className="pt-0">
            <SidebarMenu className="space-y-1">
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {!isExpanded ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.url} end className={getNavLinkClass}>
                            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12} className="bg-[#0B1220] text-white border border-white/20 shadow-xl px-3 py-2 rounded-md">
                          <p className="text-sm font-medium whitespace-nowrap">{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink to={item.url} end className={getNavLinkClass}>
                        <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                        <span className="text-body">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Operations */}
          <SidebarGroup>
            <SidebarMenu className="space-y-1">
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {!isExpanded ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.url} className={getNavLinkClass}>
                            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12} className="bg-[#0B1220] text-white border border-white/20 shadow-xl px-3 py-2 rounded-md">
                          <p className="text-sm font-medium whitespace-nowrap">{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink to={item.url} className={getNavLinkClass}>
                        <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                        <span className="text-body">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Sign Out */}
          <SidebarMenu className={`${isExpanded ? 'mt-auto pt-6' : 'mt-auto pt-4 flex justify-center'}`}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                {!isExpanded ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={signOut}
                        className="flex items-center justify-center px-0 py-3 rounded-lg text-[#E5E7EB] hover:bg-white/5 hover:text-[#CF0A0A] transition-all duration-150 ease-in-out"
                      >
                        <LogOut className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="bg-[#0B1220] text-white border border-white/20 shadow-xl px-3 py-2 rounded-md">
                      <p className="text-sm font-medium whitespace-nowrap">Sign Out</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#E5E7EB] hover:bg-white/5 hover:text-[#CF0A0A] transition-all duration-150 ease-in-out w-full"
                  >
                    <LogOut className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                    <span className="text-body">Sign Out</span>
                  </button>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
