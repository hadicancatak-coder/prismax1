import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckSquare, Calendar, LayoutDashboard as DashboardIcon, LogOut, Megaphone, Target, Bell, FolderKanban, Link2, Share2, Music, Ghost, MessageCircle } from "lucide-react";
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
  { title: "PPC Planner", url: "/ads", icon: Megaphone },
  { title: "SocialUA", url: "/socialua", icon: Share2 },
  { title: "TikTok", url: "/tiktok", icon: Music },
  { title: "Snap", url: "/snap", icon: Ghost },
  { title: "Reddit", url: "/reddit", icon: MessageCircle },
  { title: "UTM Planner", url: "/utm-planner", icon: Link2 },
  { title: "Preview", url: "/campaigns", icon: Target },
];

const teamItems = [
  { title: "Base", url: "/team-base", icon: FolderKanban },
  { title: "Notifications", url: "/notifications", icon: Bell },
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
      ? `flex items-center ${open ? 'gap-3 px-4' : 'justify-center px-0'} py-2.5 rounded-xl bg-primary/10 text-primary ${open ? 'border-l-4 border-l-primary ml-[-4px]' : ''} font-semibold shadow-[0_0_15px_rgba(0,87,255,0.15)] transition-colors`
      : `flex items-center ${open ? 'gap-3 px-4' : 'justify-center px-0'} py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors`;

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarContent className={`bg-gradient-sidebar overflow-y-auto sidebar-scroll ${open ? 'px-4 py-6 space-y-8' : 'px-2 py-4 space-y-4'}`}>
          {/* Logo */}
          <div className={`flex ${open ? 'items-center gap-3 px-2' : 'flex-col items-center justify-center'}`}>
            <img 
              src={logoImage} 
              alt="Prisma" 
              className={`transition-all ${open ? 'h-10' : 'h-8'}`}
            />
            {open && (
              <div className="flex flex-col">
                <span className="font-bold text-xl text-sidebar-primary-foreground tracking-tight leading-none">Prisma</span>
                {userName && (
                  <span className="text-xs text-sidebar-foreground/70 uppercase tracking-wider mt-0.5">
                    {userName}
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


          {/* Sign Out */}
          <SidebarMenu className={open ? '' : 'flex justify-center'}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                {!open ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={signOut}
                        className="flex items-center justify-center w-12 h-12 rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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
