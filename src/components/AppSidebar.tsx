import { CheckSquare, Calendar, LayoutDashboard, LogOut, Megaphone, Target, Rocket, Bell, FolderKanban, Link2 } from "lucide-react";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Agenda", url: "/calendar", icon: Calendar },
];

const operationsItems = [
  { title: "Launch Pad", url: "/launch-pad", icon: Rocket },
  { title: "PPC Planner", url: "/ads", icon: Megaphone },
  { title: "UTM Planner", url: "/utm-planner", icon: Link2 },
  { title: "Preview", url: "/campaigns", icon: Target },
];

const teamItems = [
  { title: "Base", url: "/team-base", icon: FolderKanban },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { signOut, userRole } = useAuth();

  return (
    <Sidebar collapsible="icon" className="bg-sidebar border-r border-sidebar-border">
      <div className="p-5 flex items-center justify-between border-b border-gray-200/60">
        {open && (
          <div className="flex items-center gap-3">
            <img src={cfiLogo} alt="CFI Logo" className="h-9 w-9 object-contain" />
            {userRole && (
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">{userRole}</span>
            )}
          </div>
        )}
        {!open && <img src={cfiLogo} alt="CFI Logo" className="h-9 w-9 object-contain mx-auto" />}
        <SidebarTrigger className="ml-auto text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" />
      </div>
      
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-3">
            Core
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium shadow-sm transition-all duration-200"
                          : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-3">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium shadow-sm transition-all duration-200"
                          : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-3">
            Team
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {teamItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium shadow-sm transition-all duration-200"
                          : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={signOut}
                  className="text-sidebar-foreground/70 hover:bg-destructive/90 hover:text-destructive-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
