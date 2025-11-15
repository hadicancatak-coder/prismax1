import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-4 bg-white/10 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted-hover rounded transition-all min-h-[44px] min-w-[44px]" />
      </div>

      {/* Centered Search Bar */}
      <div className="flex-1 flex justify-center">
        <GlobalSearch />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Create Button with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1 min-h-[36px]">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card z-50">
            <DropdownMenuItem onClick={() => navigate("/tasks")}>
              📋 New Task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/operations/status-log")}>
              📝 Status Log
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/operations/custom-reports")}>
              📊 Google Sheets
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/ads/search")}>
              📢 Search Campaign
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/utm-planner")}>
              🔗 UTM Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationBell />
        <UserMenu />
      </div>
    </div>
  );
}
