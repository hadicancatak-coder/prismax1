import { Home, CheckSquare, Calendar, Clock, LayoutDashboard, LogOut, Shield, FileText, User, Bell, FolderKanban, AlertCircle, Megaphone, ListTodo, Target } from "lucide-react";
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

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Team Base", url: "/team-base", icon: FolderKanban },
  { title: "Ads Planner", url: "/ads", icon: Megaphone },
  { title: "Campaigns", url: "/campaigns", icon: Target },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { signOut, userRole } = useAuth();

  return (
    <Sidebar collapsible="icon" className="bg-sidebar-background border-r border-sidebar-border" style={{ background: 'var(--gradient-sidebar)' }}>
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border/50">
        {open && (
          <div>
            <h2 className="text-xl font-bold text-sidebar-foreground tracking-tight">Prisma</h2>
            {userRole && (
              <span className="text-xs text-sidebar-foreground/60 capitalize font-medium">{userRole}</span>
            )}
          </div>
        )}
        <SidebarTrigger className="ml-auto text-sidebar-foreground hover:text-sidebar-primary transition-colors" />
      </div>
      
      <SidebarContent className="bg-transparent">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-semibold tracking-wider uppercase">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium rounded-lg transition-all duration-300 shadow-md shadow-sidebar-accent/20"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-md hover:shadow-sidebar-accent/10 rounded-lg transition-all duration-300"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {userRole === "admin" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/backlog"
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium rounded-lg transition-all duration-300 shadow-md shadow-sidebar-accent/20"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-md hover:shadow-sidebar-accent/10 rounded-lg transition-all duration-300"
                        }
                      >
                        <ListTodo className="h-4 w-4" />
                        <span>Backlog</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/admin-panel"
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium rounded-lg transition-all duration-300 shadow-md shadow-sidebar-accent/20"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-md hover:shadow-sidebar-accent/10 rounded-lg transition-all duration-300"
                        }
                      >
                        <Shield className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={signOut}
                  className="text-sidebar-foreground/80 hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-all duration-300"
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
