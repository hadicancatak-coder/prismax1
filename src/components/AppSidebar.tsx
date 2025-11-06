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
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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

interface NavItemProps {
  item: { title: string; url: string; icon: any };
  isExpanded: boolean;
}

const NavItem = ({ item, isExpanded }: NavItemProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={item.url}
          end={item.url === "/"}
          className={({ isActive }) => cn(
            // Base styles: 40x40 hit target
            "relative flex items-center justify-center h-10 w-full rounded-lg",
            "transition-all duration-150 ease-in-out",
            
            // Collapsed: center icon
            !isExpanded && "px-0",
            
            // Expanded: left-align with padding
            isExpanded && "px-3 gap-3 justify-start",
            
            // Default state
            "text-[#E5E7EB]",
            
            // Hover state - subtle background
            "hover:bg-white/6",
            
            // Active state
            isActive && "text-white font-medium"
          )}
        >
          {({ isActive }) => (
            <>
              {/* Active indicator - small bar on left, INSIDE the item */}
              {isActive && (
                <span 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-[3px] h-[22px] bg-[#CF0A0A] rounded-full"
                  aria-hidden="true"
                />
              )}
              
              {/* Icon - always visible, offset right when active & collapsed */}
              <item.icon 
                className={cn(
                  "h-5 w-5 shrink-0",
                  // When collapsed and active, offset icon to avoid overlap with indicator
                  !isExpanded && isActive && "ml-4"
                )} 
                strokeWidth={2.5} 
              />
              
              {/* Label - only when expanded */}
              {isExpanded && (
                <span className="text-sm truncate opacity-100 animate-fade-in-150">
                  {item.title}
                </span>
              )}
            </>
          )}
        </NavLink>
      </TooltipTrigger>
      
      {/* Tooltip - only show when collapsed */}
      {!isExpanded && (
        <TooltipContent 
          side="right" 
          sideOffset={12}
          className="bg-black/90 text-white border-0 shadow-xl px-3 py-2 rounded-md text-xs z-50"
        >
          {item.title}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

interface SignOutButtonProps {
  isExpanded: boolean;
  signOut: () => void;
}

const SignOutButton = ({ isExpanded, signOut }: SignOutButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={signOut}
          className={cn(
            "relative flex items-center justify-center h-10 w-full rounded-lg",
            "transition-all duration-150 ease-in-out",
            "text-[#E5E7EB] hover:bg-white/6 hover:text-[#CF0A0A]",
            !isExpanded && "px-0",
            isExpanded && "px-3 gap-3 justify-start"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          {isExpanded && (
            <span className="text-sm truncate opacity-100 animate-fade-in-150">
              Sign Out
            </span>
          )}
        </button>
      </TooltipTrigger>
      
      {!isExpanded && (
        <TooltipContent 
          side="right" 
          sideOffset={12}
          className="bg-black/90 text-white border-0 shadow-xl px-3 py-2 rounded-md text-xs z-50"
        >
          Sign Out
        </TooltipContent>
      )}
    </Tooltip>
  );
};

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

  return (
    <TooltipProvider delayDuration={150}>
      <Sidebar 
        collapsible="icon" 
        variant="floating"
        className="h-[calc(100vh-32px)] sticky top-4 border border-white/8 shadow-lg rounded-[10px] transition-all duration-150 ease-in-out"
        style={{ 
          background: 'rgba(11, 18, 32, 0.95)',
          width: isExpanded ? '260px' : '72px'
        }}
      >
        <SidebarContent className="flex flex-col py-4 px-0">
          {/* Logo Section - Minimal when collapsed */}
          <div className="px-4 pb-4 flex items-center justify-center">
            {isExpanded ? (
              <div className="flex items-center gap-3">
                <img src={logoImage} alt="Prisma" className="h-10" />
                <div className="flex flex-col">
                  <span className="text-white font-semibold">Prisma</span>
                  {userName && <span className="text-[#9CA3AF] text-xs">{userName}</span>}
                </div>
              </div>
            ) : (
              <img src={logoImage} alt="Prisma" className="h-8" />
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/8 mx-4 mb-4" />

          {/* Navigation - Core & Operations combined */}
          <nav className="flex-1 px-3 space-y-2">
            {/* Core Items */}
            {coreItems.map((item) => (
              <NavItem key={item.title} item={item} isExpanded={isExpanded} />
            ))}

            {/* Divider between sections */}
            <div className="border-t border-white/8 my-4" />

            {/* Operations Items */}
            {operationsItems.map((item) => (
              <NavItem key={item.title} item={item} isExpanded={isExpanded} />
            ))}
          </nav>

          {/* Bottom divider */}
          <div className="border-t border-white/8 mx-4 my-4" />

          {/* Sign Out - Pinned to bottom */}
          <div className="px-3 mt-auto">
            <SignOutButton isExpanded={isExpanded} signOut={signOut} />
          </div>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
