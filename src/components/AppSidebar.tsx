import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckSquare, Calendar, LayoutDashboard as DashboardIcon, LogOut, Megaphone, Target, Bell, FolderKanban, Link2, Share2, FileText, PenTool } from "lucide-react";
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
  const { open } = useSidebar();
  const { signOut, userRole, user } = useAuth();
  const [userName, setUserName] = useState<string>("");

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

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? `flex items-center ${open ? 'gap-3 px-3 ml-[-4px] border-l-4 border-primary' : 'justify-center px-0 ml-[-4px] border-l-4 border-primary'} py-3 text-primary font-medium transition-smooth`
      : `flex items-center ${open ? 'gap-3 px-3 ml-[-4px] border-l-4 border-transparent' : 'justify-center px-0 ml-[-4px] border-l-4 border-transparent'} py-3 text-sidebar-foreground hover:text-sidebar-primary-foreground hover:border-l-sidebar-foreground/20 transition-smooth`;

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon" variant="floating">
        <SidebarContent className={`bg-sidebar-background overflow-y-auto sidebar-scroll ${open ? 'px-4 py-8 space-y-8' : 'px-2 py-6 space-y-6'}`}>
          {/* Logo */}
          <div className={`flex ${open ? 'items-center gap-3 px-3 pb-6 border-b border-sidebar-border' : 'flex-col items-center justify-center pb-4 border-b border-sidebar-border'}`}>
            <img 
              src={logoImage} 
              alt="Prisma" 
              className={`transition-smooth ${open ? 'h-10' : 'h-8'}`}
            />
            {open && (
              <div className="flex flex-col">
                <span className="text-section-title text-sidebar-foreground font-semibold">Prisma</span>
                {userName && (
                  <span className="text-metadata text-sidebar-foreground/60 mt-0.5">
                    {userName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Core Features */}
          <SidebarGroup>
            {open && <SidebarGroupLabel className="text-metadata text-sidebar-foreground/60 uppercase tracking-wider px-3 mb-3">Core</SidebarGroupLabel>}
            <SidebarMenu className="space-y-1">
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {!open ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.url} end className={getNavLinkClass}>
                            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-slate-900 dark:bg-slate-800 text-white border border-slate-700">
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
            {open && <SidebarGroupLabel className="text-metadata text-sidebar-foreground/60 uppercase tracking-wider px-3 mb-3">Operations</SidebarGroupLabel>}
            <SidebarMenu className="space-y-1">
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {!open ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.url} className={getNavLinkClass}>
                            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-slate-900 dark:bg-slate-800 text-white border border-slate-700">
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
          <SidebarMenu className={`${open ? 'mt-auto pt-6 border-t border-sidebar-border' : 'mt-auto pt-4 border-t border-sidebar-border flex justify-center'}`}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                {!open ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={signOut}
                        className="flex items-center justify-center px-0 ml-[-4px] border-l-4 border-transparent py-3 text-sidebar-foreground hover:text-destructive transition-smooth"
                      >
                        <LogOut className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-900 dark:bg-slate-800 text-white border border-slate-700">
                      <p className="text-sm font-medium whitespace-nowrap">Sign Out</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-3 ml-[-4px] border-l-4 border-transparent py-3 text-sidebar-foreground hover:text-destructive transition-smooth w-full"
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
