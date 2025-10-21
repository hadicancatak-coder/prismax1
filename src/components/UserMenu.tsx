import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Shield, Info, LogOut, Activity, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const UserMenu = () => {
  const navigate = useNavigate();
  const { user, signOut, userRole } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("user_id", user?.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const getInitials = () => {
    if (!profile?.name) return "U";
    return profile.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none focus:outline-none">
          <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/security")} className="cursor-pointer">
          <Shield className="mr-2 h-4 w-4" />
          Security
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/about")} className="cursor-pointer">
          <Info className="mr-2 h-4 w-4" />
          About
        </DropdownMenuItem>
        
        {userRole === 'admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/activity-log")} className="cursor-pointer">
              <Activity className="mr-2 h-4 w-4" />
              Activity Log
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/overview")} className="cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Admin Dashboard
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
