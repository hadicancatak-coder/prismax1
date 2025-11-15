import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CheckSquare, 
  Calendar, 
  LogOut, 
  Megaphone, 
  Link2, 
  FileText, 
  ClipboardList,
  PenTool, 
  Monitor, 
  Database, 
  MapPin,
  Tv,
  ChevronDown
} from "lucide-react";
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const coreItems = [
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Agenda", url: "/calendar", icon: Calendar },
];

const adsItems = [
  { title: "Search Planner", url: "/ads/search", icon: Megaphone },
  { title: "Display Planner", url: "/ads/display", icon: Monitor },
  { title: "Copy Writer", url: "/copywriter", icon: PenTool },
  { title: "Saved Elements", url: "/ads/library", icon: Database },
  { title: "UTM Planner", url: "/utm-planner", icon: Link2 },
];

const mediaItems = [
  { title: "Location Intel", url: "/location-intelligence", icon: MapPin },
  { title: "Web Intel", url: "/web-intel", icon: Tv },
];

const operationsItems = [
  { title: "Audit Logs", url: "/operations", icon: FileText },
  { title: "Status Log", url: "/operations/status-log", icon: ClipboardList },
  { title: "Custom Reports", url: "/operations/custom-reports", icon: FileText },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { open } = useSidebar();
  const { signOut, user } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const [adsOpen, setAdsOpen] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(true);
  const [opsOpen, setOpsOpen] = useState(true);

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
      ? `flex items-center ${open ? 'gap-3 px-3 border-l-4 border-primary ml-[-4px]' : 'justify-center px-0 border-l-4 border-primary ml-[-4px]'} py-3 text-primary font-medium transition-smooth`
      : `flex items-center ${open ? 'gap-3 px-3 border-l-4 border-transparent ml-[-4px]' : 'justify-center px-0'} py-3 text-gray-200 hover:text-primary hover:border-l-primary/20 transition-smooth`;

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon" className="bg-black/20 backdrop-blur-md border-r border-white/10">
        <SidebarContent className="flex flex-col h-full overflow-hidden">
          {/* Header with Logo */}
          <div className={`${open ? 'px-4 py-6' : 'px-2 py-4'} border-b border-sidebar-border shrink-0`}>
            <div 
              onClick={() => navigate('/')}
              className={`flex ${open ? 'items-center gap-3' : 'flex-col items-center justify-center'} cursor-pointer hover:opacity-80 transition-smooth`}
            >
              <img 
                src={logoImage} 
                alt="Prisma" 
                className={`${open ? 'h-10' : 'h-8'} transition-smooth`}
              />
              {open && (
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-white">Prisma</span>
                  {userName && (
                    <span className="text-xs text-gray-300">
                      {userName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Scrollable Navigation Area */}
          <div className={`flex-1 overflow-y-auto sidebar-scroll ${open ? 'px-4 py-4' : 'px-2 py-4'}`}>
            {/* Core Features */}
            <SidebarGroup>
              {open && <SidebarGroupLabel className="text-xs text-gray-400 uppercase tracking-wider mb-2">Core</SidebarGroupLabel>}
              <SidebarMenu className="space-y-1">
                {coreItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink to={item.url} end className={getNavLinkClass}>
                            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                            {open && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </TooltipTrigger>
                        {!open && <TooltipContent side="right">{item.title}</TooltipContent>}
                      </Tooltip>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            {/* Ads Group */}
            <Collapsible open={adsOpen} onOpenChange={setAdsOpen} className="mt-4">
              <SidebarGroup>
                {open && (
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="text-xs text-gray-400 uppercase tracking-wider mb-2 cursor-pointer hover:text-gray-200 flex items-center justify-between">
                      Ads
                      <ChevronDown className={`h-3 w-3 transition-transform ${adsOpen ? 'rotate-180' : ''}`} />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                )}
                <CollapsibleContent>
                  <SidebarMenu className="space-y-1">
                    {adsItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <NavLink to={item.url} className={getNavLinkClass}>
                                <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                                {open && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </TooltipTrigger>
                            {!open && <TooltipContent side="right">{item.title}</TooltipContent>}
                          </Tooltip>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            {/* Media Group */}
            <Collapsible open={mediaOpen} onOpenChange={setMediaOpen} className="mt-4">
              <SidebarGroup>
                {open && (
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="text-xs text-gray-400 uppercase tracking-wider mb-2 cursor-pointer hover:text-gray-200 flex items-center justify-between">
                      Media
                      <ChevronDown className={`h-3 w-3 transition-transform ${mediaOpen ? 'rotate-180' : ''}`} />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                )}
                <CollapsibleContent>
                  <SidebarMenu className="space-y-1">
                    {mediaItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <NavLink to={item.url} className={getNavLinkClass}>
                                <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                                {open && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </TooltipTrigger>
                            {!open && <TooltipContent side="right">{item.title}</TooltipContent>}
                          </Tooltip>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            {/* Operations Group */}
            <Collapsible open={opsOpen} onOpenChange={setOpsOpen} className="mt-4">
              <SidebarGroup>
                {open && (
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="text-xs text-gray-400 uppercase tracking-wider mb-2 cursor-pointer hover:text-gray-200 flex items-center justify-between">
                      Operations
                      <ChevronDown className={`h-3 w-3 transition-transform ${opsOpen ? 'rotate-180' : ''}`} />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                )}
                <CollapsibleContent>
                  <SidebarMenu className="space-y-1">
                    {operationsItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <NavLink to={item.url} className={getNavLinkClass}>
                                <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                                {open && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </TooltipTrigger>
                            {!open && <TooltipContent side="right">{item.title}</TooltipContent>}
                          </Tooltip>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </div>

          {/* Footer with Sign Out */}
          <SidebarFooter className={`border-t border-sidebar-border ${open ? 'p-4' : 'p-2'} shrink-0`}>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild onClick={signOut}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`flex items-center ${open ? 'gap-3 px-3' : 'justify-center'} py-3 text-gray-200 hover:text-primary cursor-pointer transition-smooth`}>
                        <LogOut className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                        {open && <span className="text-sm">Sign Out</span>}
                      </div>
                    </TooltipTrigger>
                    {!open && <TooltipContent side="right">Sign Out</TooltipContent>}
                  </Tooltip>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
