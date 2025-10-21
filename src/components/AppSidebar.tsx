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
    <Sidebar collapsible="icon" className="bg-sidebar-background border-r border-sidebar-border">
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border/50">
        {open && (
          <div className="flex items-center gap-2">
            <img src={cfiLogo} alt="CFI Logo" className="h-8 w-8 object-contain" />
            {userRole && (
              <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
            )}
          </div>
        )}
        {!open && <img src={cfiLogo} alt="CFI Logo" className="h-8 w-8 object-contain mx-auto" />}
        <SidebarTrigger className="ml-auto text-sidebar-foreground hover:text-sidebar-accent-foreground" />
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground">Core</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground">Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teamItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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
