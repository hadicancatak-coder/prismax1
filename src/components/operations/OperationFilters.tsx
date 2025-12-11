import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

const ppcPlatforms = ["Google", "Search", "DGen", "PMax", "Display", "GDN", "YouTube"];
const socialPlatforms = ["Meta", "Facebook", "Instagram", "X", "TikTok", "Snap", "Reddit"];
const allPlatforms = [...ppcPlatforms, ...socialPlatforms];

interface OperationFiltersProps {
  platformFilter: string;
  statusFilter: string;
  teamFilter: string;
  onPlatformChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTeamChange: (value: string) => void;
}

export function OperationFilters({
  platformFilter,
  statusFilter,
  teamFilter,
  onPlatformChange,
  onStatusChange,
  onTeamChange,
}: OperationFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = platformFilter !== "all" || statusFilter !== "all" || teamFilter !== "all";
  const activeFilterCount = 
    (platformFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (teamFilter !== "all" ? 1 : 0);

  const handleClearAll = () => {
    onPlatformChange("all");
    onStatusChange("all");
    onTeamChange("all");
  };

  return (
    <Card className="p-sm">
      <div className="flex items-center gap-md">
        {/* Compact row - always visible */}
        <div className="flex items-center gap-sm flex-1">
          <Select value={teamFilter} onValueChange={onTeamChange}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="PPC">PPC</SelectItem>
              <SelectItem value="SocialUA">Social UA</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-sm"
          >
            <Filter className="h-4 w-4" />
            More Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="h-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Expanded section */}
      {isExpanded && (
        <div className="pt-sm mt-sm border-t space-y-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            <div className="space-y-sm">
              <label className="text-body-sm font-medium">Platform</label>
              <Select value={platformFilter} onValueChange={onPlatformChange}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {allPlatforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
