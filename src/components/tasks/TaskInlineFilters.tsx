import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertCircle, Clock, Shield, TrendingUp, Users, Calendar as CalendarIcon } from "lucide-react";
import { AssigneeMultiSelect } from "@/components/AssigneeMultiSelect";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface TaskInlineFiltersProps {
  selectedAssignees: string[];
  onAssigneesChange: (assignees: string[]) => void;
  selectedTeams: string[];
  onTeamsChange: (teams: string[]) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  activeQuickFilter: string | null;
  onQuickFilterChange: (filter: string | null) => void;
  quickFilters: Array<{ label: string; Icon: any; filter: (task: any) => boolean }>;
  filteredTasks: any[];
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

const TEAMS = ["SocialUA", "PPC", "PerMar"];

export function TaskInlineFilters({
  selectedAssignees,
  onAssigneesChange,
  selectedTeams,
  onTeamsChange,
  statusFilter,
  onStatusChange,
  activeQuickFilter,
  onQuickFilterChange,
  quickFilters,
  filteredTasks,
  dateRange,
  onDateRangeChange,
}: TaskInlineFiltersProps) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, username")
      .order("name");
    setUsers(data || []);
  };

  const hasActiveFilters = 
    selectedAssignees.length > 0 || 
    selectedTeams.length > 0 || 
    statusFilter !== "all" || 
    activeQuickFilter !== null ||
    dateRange.from !== undefined ||
    dateRange.to !== undefined;

  const handleClearAll = () => {
    onAssigneesChange([]);
    onTeamsChange([]);
    onStatusChange("all");
    onQuickFilterChange(null);
    onDateRangeChange({ from: undefined, to: undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick Filters Dropdown */}
      <Select 
        value={activeQuickFilter || "none"} 
        onValueChange={(value) => onQuickFilterChange(value === "none" ? null : value)}
      >
        <SelectTrigger className="w-[160px] min-h-[44px]">
          <SelectValue placeholder="Quick Filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All Tasks</SelectItem>
          {quickFilters.map(({ label, Icon }) => {
            const count = filteredTasks.filter(quickFilters.find(f => f.label === label)!.filter).length;
            return (
              <SelectItem key={label} value={label}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label} ({count})
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Assignees Multi-Select */}
      <div className="w-[180px]">
        <Select 
          value={selectedAssignees.length > 0 ? "selected" : "all"}
          onValueChange={(value) => {
            if (value === "all") onAssigneesChange([]);
          }}
        >
          <SelectTrigger className="min-h-[44px]">
            <SelectValue>
              {selectedAssignees.length === 0 ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All Assignees
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {selectedAssignees.length} selected
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {users.map((user) => (
              <div 
                key={user.user_id}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  const newSelection = selectedAssignees.includes(user.user_id)
                    ? selectedAssignees.filter(id => id !== user.user_id)
                    : [...selectedAssignees, user.user_id];
                  onAssigneesChange(newSelection);
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedAssignees.includes(user.user_id)}
                  onChange={() => {}}
                  className="rounded"
                />
                <span className="text-sm">{user.name || user.username}</span>
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Teams Multi-Select */}
      <div className="w-[160px]">
        <Select 
          value={selectedTeams.length > 0 ? "selected" : "all"}
          onValueChange={(value) => {
            if (value === "all") onTeamsChange([]);
          }}
        >
          <SelectTrigger className="min-h-[44px]">
            <SelectValue>
              {selectedTeams.length === 0 ? (
                "All Teams"
              ) : (
                `${selectedTeams.length} team${selectedTeams.length > 1 ? 's' : ''}`
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {TEAMS.map((team) => (
              <div 
                key={team}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  const newSelection = selectedTeams.includes(team)
                    ? selectedTeams.filter(t => t !== team)
                    : [...selectedTeams, team];
                  onTeamsChange(newSelection);
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(team)}
                  onChange={() => {}}
                  className="rounded"
                />
                <span className="text-sm">{team}</span>
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px] min-h-[44px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Ongoing">Ongoing</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
          <SelectItem value="Blocked">Blocked</SelectItem>
          <SelectItem value="Failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[220px] min-h-[44px] justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM d, yyyy")
              )
            ) : (
              "Date Range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range) {
                onDateRangeChange({ from: range.from, to: range.to });
              } else {
                onDateRangeChange({ from: undefined, to: undefined });
              }
            }}
            initialFocus
            numberOfMonths={2}
          />
          {(dateRange.from || dateRange.to) && (
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
                className="w-full"
              >
                Clear Date Range
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClearAll}
          className="gap-2 min-h-[44px]"
        >
          <X className="h-4 w-4" />
          Clear All
        </Button>
      )}
    </div>
  );
}
