import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckSquare, Calendar, LayoutDashboard as DashboardIcon, LogOut, Megaphone, Target, Bell, FolderKanban, Link2, Share2, FileText, PenTool, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/cfi-logo.png";
import { useSidebar } from "@/components/ui/sidebar";
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
            // Base: 40x40 button
            "relative flex items-center h-10 w-full rounded-lg",
            "transition-all duration-150 ease-in-out",
            
            // Layout based on expansion
            !isExpanded && "justify-center px-0",
            isExpanded && "justify-start px-3 gap-3",
            
            // Colors
            "text-[#E5E7EB]",
            "hover:bg-white/6",
            isActive && "text-white font-medium"
          )}
        >
          {({ isActive }) => (
            <>
              {/* Active indicator - only in collapsed mode, NOT full-height line */}
              {isActive && !isExpanded && (
                <span 
                  className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[3px] h-[22px] bg-[#CF0A0A] rounded-full"
                  aria-hidden="true"
                />
              )}
              
              {/* Icon */}
              <item.icon 
                className={cn(
                  "h-5 w-5 shrink-0",
                  // Offset when collapsed + active to avoid indicator overlap
                  !isExpanded && isActive && "ml-4"
                )} 
                strokeWidth={2.5} 
              />
              
              {/* Label - only when expanded */}
              {isExpanded && (
                <span className="text-sm truncate">
                  {item.title}
                </span>
              )}
            </>
          )}
        </NavLink>
      </TooltipTrigger>
      
      {/* Tooltip - ONLY when collapsed */}
      {!isExpanded && (
        <TooltipContent 
          side="right" 
          sideOffset={12}
          className="bg-black/90 text-white border-0 shadow-xl px-3 py-2 rounded-md text-xs"
          style={{ zIndex: 70 }}
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
  const { open, setOpen } = useSidebar();
  const { signOut, user } = useAuth();
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

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isExpanded, setOpen]);

  return (
    <TooltipProvider delayDuration={150}>
      {/* Backdrop - click to close */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          style={{ zIndex: 55 }}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Base Rail: Always 72px, sticky positioning */}
      <aside
        className="sticky top-4 h-[calc(100vh-32px)] self-start m-4 ml-4 flex-shrink-0"
        style={{ 
          width: '72px',
          zIndex: 50
        }}
      >
        {/* Collapsed Rail (always visible) */}
        <div 
          className="h-full border border-white/8 shadow-lg rounded-[10px] bg-[#0B1220] flex flex-col py-4"
        >
          {/* Logo - minimal */}
          <div className="px-4 pb-4 flex items-center justify-center">
            <img src={logoImage} alt="Prisma" className="h-8" />
          </div>

          {/* Divider */}
          <div className="border-t border-white/8 mx-4 mb-4" />

          {/* Navigation Icons */}
          <nav className="flex-1 px-3 space-y-2">
            {/* Core Items */}
            {coreItems.map((item) => (
              <NavItem key={item.title} item={item} isExpanded={false} />
            ))}

            {/* Divider */}
            <div className="border-t border-white/8 my-4" />

            {/* Operations Items */}
            {operationsItems.map((item) => (
              <NavItem key={item.title} item={item} isExpanded={false} />
            ))}
          </nav>

          {/* Bottom divider */}
          <div className="border-t border-white/8 mx-4 my-4" />

          {/* Sign Out */}
          <div className="px-3">
            <SignOutButton isExpanded={false} signOut={signOut} />
          </div>
        </div>

        {/* Expanded Overlay Panel: position fixed, 260px */}
        {isExpanded && (
          <div
            className="fixed top-4 left-4 h-[calc(100vh-32px)] border border-white/8 shadow-2xl rounded-[10px] bg-[#0B1220] flex flex-col py-4 animate-in slide-in-from-left-2 duration-150"
            style={{ 
              width: '260px',
              zIndex: 60
            }}
          >
            {/* Logo - expanded */}
            <div className="px-4 pb-4 flex items-center gap-3">
              <img src={logoImage} alt="Prisma" className="h-10" />
              <div className="flex flex-col">
                <span className="text-white font-semibold">Prisma</span>
                {userName && <span className="text-[#9CA3AF] text-xs">{userName}</span>}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/8 mx-4 mb-4" />

            {/* Navigation - with labels */}
            <nav className="flex-1 px-3 space-y-2">
              {coreItems.map((item) => (
                <NavItem key={item.title} item={item} isExpanded={true} />
              ))}

              <div className="border-t border-white/8 my-4" />

              {operationsItems.map((item) => (
                <NavItem key={item.title} item={item} isExpanded={true} />
              ))}
            </nav>

            {/* Bottom divider */}
            <div className="border-t border-white/8 mx-4 my-4" />

            {/* Sign Out */}
            <div className="px-3">
              <SignOutButton isExpanded={true} signOut={signOut} />
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
