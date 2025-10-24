import { CheckSquare, Calendar, LayoutDashboard as DashboardIcon, LogOut, Megaphone, Target, Rocket, Bell, FolderKanban, Link2, Database, BarChart3, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import cfiLogo from "@/assets/cfi-logo.png";

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
      ? "flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/10 text-primary border-l-4 border-l-primary ml-[-4px] font-semibold shadow-[0_0_15px_rgba(0,87,255,0.15)] transition-all duration-200"
      : "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.02] transition-all duration-200";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="p-6 flex items-center justify-between border-b border-sidebar-border">
        {open && (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <img src={cfiLogo} alt="CFI Logo" className="h-7 w-7 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-sidebar-foreground">Prisma</span>
              {userRole && (
                <span className="text-xs text-sidebar-foreground/60 uppercase tracking-wide">{userRole}</span>
              )}
            </div>
          </div>
        )}
        {!open && (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 mx-auto">
            <img src={cfiLogo} alt="CFI Logo" className="h-7 w-7 object-contain" />
          </div>
        )}
        <SidebarTrigger className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-all" />
      </div>
      
      <SidebarContent className="px-4 py-6 bg-gradient-sidebar space-y-8">
        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-xs font-bold text-sidebar-foreground/50 uppercase tracking-wider mb-3 px-3">Core</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavLinkClass}>
                      <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-xs font-bold text-sidebar-foreground/50 uppercase tracking-wider mb-3 px-3">Operations</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavLinkClass}>
                      <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-xs font-bold text-sidebar-foreground/50 uppercase tracking-wider mb-3 px-3">Analytics</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavLinkClass}>
                      <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {open && <SidebarGroupLabel className="text-xs font-bold text-sidebar-foreground/50 uppercase tracking-wider mb-3 px-3">Team</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {teamItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavLinkClass}>
                      <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto pt-6 border-t border-sidebar-border">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={signOut}
                  className="text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive hover:scale-[1.02] transition-all duration-200 rounded-xl py-2.5"
                >
                  <LogOut className="h-5 w-5" strokeWidth={2} />
                  {open && <span className="font-semibold">Sign Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
