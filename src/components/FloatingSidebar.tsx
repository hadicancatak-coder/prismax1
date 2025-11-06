import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Home, CheckSquare, Calendar, ClipboardList, Link2, FileText, Users, Zap, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import logoImage from "@/assets/cfi-logo.png";

const coreItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Agenda", url: "/calendar", icon: Calendar },
];

const operationsItems = [
  { title: "Audit Logs", url: "/operations", icon: ClipboardList },
  { title: "PPC Planner", url: "/utm-planner", icon: Link2 },
  { title: "Copywriter", url: "/copywriter", icon: FileText },
  { title: "Team", url: "/team", icon: Users },
  { title: "Ads", url: "/ads", icon: Zap },
];

export function FloatingSidebar() {
  const { signOut, user } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);

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
          }
        });
    }
  }, [user]);

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base = `flex items-center ${isHovered ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-lg relative transition-all duration-150 ease-in-out`;
    
    if (isActive) {
      return `${base} text-white font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-8 before:bg-[#CF0A0A] before:rounded-r`;
    }
    
    return `${base} text-muted-foreground hover:text-white hover:bg-white/5`;
  };

  return (
    <TooltipProvider>
      <div
        className="fixed top-4 left-4 h-[calc(100vh-32px)] z-50 transition-all duration-300 ease-in-out rounded-[10px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25),0_4px_12px_-4px_rgba(0,0,0,0.15),0_2px_6px_-2px_rgba(0,0,0,0.1)] border border-white/20 backdrop-blur-sm overflow-hidden"
        style={{ 
          background: 'rgba(11, 18, 32, 0.95)', 
          width: isHovered ? '260px' : '72px' 
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`h-full flex flex-col overflow-y-auto sidebar-scroll ${isHovered ? 'px-4 py-8 space-y-8' : 'px-2 py-6 space-y-6'}`}>
          {/* Logo */}
          <div className={`flex ${isHovered ? 'items-center gap-3 px-3 pb-6' : 'flex-col items-center justify-center pb-4'}`}>
            <img 
              src={logoImage} 
              alt="Prisma" 
              className={`transition-all duration-150 ease-in-out ${isHovered ? 'h-10' : 'h-8'}`}
            />
            {isHovered && (
              <div className="flex flex-col">
                <span className="text-section-title text-white font-semibold">Prisma</span>
                {userName && (
                  <span className="text-xs text-muted-foreground">{userName}</span>
                )}
              </div>
            )}
          </div>

          {/* Core Navigation */}
          <div className="space-y-1">
            <div className={`${isHovered ? 'px-3 mb-3' : 'text-center mb-2'}`}>
              {isHovered && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Core</span>}
            </div>
            {coreItems.map((item) => (
              <div key={item.title}>
                {!isHovered ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <NavLink to={item.url} end className={getNavLinkClass}>
                        <item.icon className="h-5 w-5" />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="bg-popover text-popover-foreground border-border">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <NavLink to={item.url} end className={getNavLinkClass}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm">{item.title}</span>
                  </NavLink>
                )}
              </div>
            ))}
          </div>

          {/* Operations Navigation */}
          <div className="space-y-1">
            <div className={`${isHovered ? 'px-3 mb-3' : 'text-center mb-2'}`}>
              {isHovered && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operations</span>}
            </div>
            {operationsItems.map((item) => (
              <div key={item.title}>
                {!isHovered ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <NavLink to={item.url} className={getNavLinkClass}>
                        <item.icon className="h-5 w-5" />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="bg-popover text-popover-foreground border-border">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <NavLink to={item.url} className={getNavLinkClass}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm">{item.title}</span>
                  </NavLink>
                )}
              </div>
            ))}
          </div>

          {/* Sign Out */}
          <div className={`${isHovered ? 'mt-auto pt-6' : 'mt-auto pt-4 flex justify-center'}`}>
            {!isHovered ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={signOut}
                    className="flex items-center justify-center py-3 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-150"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="bg-popover text-popover-foreground border-border">
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-150 w-full"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
