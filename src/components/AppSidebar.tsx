import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckSquare, Calendar, LayoutDashboard as DashboardIcon, LogOut, Megaphone, Target, Rocket, Bell, FolderKanban, Link2, Database, BarChart3, LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
  { title: "Launch Pad", url: "/launch-pad", icon: Rocket },
  { title: "PPC Planner", url: "/ads", icon: Megaphone },
  { title: "UTM Planner", url: "/utm-planner", icon: Link2 },
  { title: "Preview", url: "/campaigns", icon: Target },
];

const analyticsItems = [
  { title: "Data Sources", url: "/data-sources", icon: Database },
  { title: "Visualizations", url: "/visualizations", icon: BarChart3 },
  { title: "Dashboards", url: "/dashboards", icon: LayoutDashboard },
];

const teamItems = [
  { title: "Base", url: "/team-base", icon: FolderKanban },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { signOut, userRole } = useAuth();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/10 text-primary border-l-4 border-l-primary ml-[-4px] font-semibold shadow-[0_0_15px_rgba(0,87,255,0.15)] transition-colors"
      : "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors";

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarContent className="px-4 py-6 bg-gradient-sidebar space-y-8 overflow-y-auto sidebar-scroll">
          {/* Logo */}
          <div className={`flex items-center ${open ? 'gap-3 px-2' : 'justify-center'}`}>
            <img 
              src="/src/assets/cfi-logo.png" 
              alt="CFI Logo" 
              className={`transition-all ${open ? 'h-12' : 'h-10'}`}
            />
            {open && (
              <div className="flex flex-col">
                <span className="font-bold text-xl text-sidebar-primary-foreground tracking-tight leading-none">Mission Control</span>
                {userRole && (
                  <span className="text-xs text-sidebar-foreground/70 uppercase tracking-wider mt-0.5">
                    {userRole}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Core Features */}
          <SidebarGroup>
            {open && <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">Core</SidebarGroupLabel>}
            <SidebarMenu>
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {!open ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.url} end className={getNavLinkClass}>
                            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
                          <p className="font-medium">{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink to={item.url} end className={getNavLinkClass}>
                        <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Operations */}
          <SidebarGroup>
            {open && <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">Operations</SidebarGroupLabel>}
            <SidebarMenu>
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {!open ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.url} className={getNavLinkClass}>
                            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
                          <p className="font-medium">{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink to={item.url} className={getNavLinkClass}>
                        <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Analytics */}
          <SidebarGroup>
            {open && <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">Analytics</SidebarGroupLabel>}
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {!open ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.url} className={getNavLinkClass}>
                            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
                          <p className="font-medium">{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink to={item.url} className={getNavLinkClass}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Team */}
          <SidebarGroup>
            {open && <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">Team</SidebarGroupLabel>}
            <SidebarMenu>
              {teamItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {!open ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.url} className={getNavLinkClass}>
                            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
                          <p className="font-medium">{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink to={item.url} className={getNavLinkClass}>
                        <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Admin Section */}
          {userRole && userRole !== 'member' && (
            <SidebarGroup>
              {open && <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">Admin</SidebarGroupLabel>}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {!open ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to="/admin" className={getNavLinkClass}>
                            <Shield className="h-5 w-5 shrink-0" strokeWidth={2} />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
                          <p className="font-medium">Admin Panel</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink to="/admin" className={getNavLinkClass}>
                        <Shield className="h-5 w-5 shrink-0" strokeWidth={2} />
                        <span className="text-sm font-medium">Admin Panel</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {/* Sign Out */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                {!open ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={signOut}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
                      >
                        <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
                      <p className="font-medium">Sign Out</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
                  >
                    <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
                    <span className="text-sm font-medium">Sign Out</span>
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
