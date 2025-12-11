import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleMultiSelect } from "./SimpleMultiSelect";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { ENTITIES, TEAMS } from "@/lib/constants";
import { Search, ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import type { UtmLinkFilters } from "@/hooks/useUtmLinks";

interface UtmFiltersProps {
  filters: UtmLinkFilters;
  onFiltersChange: (filters: UtmLinkFilters) => void;
}

const LINK_PURPOSES = ["AO", "Seminar", "Webinar", "Education"];
const STATUSES = ["active", "paused", "archived"];
const LP_TYPES = [
  { value: "static", label: "Static" },
  { value: "mauritius", label: "Mauritius" },
  { value: "dynamic", label: "Dynamic" },
];

export const UtmFilters = ({ filters, onFiltersChange }: UtmFiltersProps) => {
  const { data: campaigns = [] } = useUtmCampaigns();
  const { data: platforms = [] } = useUtmPlatforms();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && (Array.isArray(value) ? value.length > 0 : value !== "")
  );

  const activeFilterCount = 
    (filters.search ? 1 : 0) +
    (filters.campaign_name?.length || 0) +
    (filters.platform?.length || 0) +
    (filters.lp_type ? 1 : 0) +
    (filters.link_purpose?.length || 0) +
    (filters.entity?.length || 0) +
    (filters.teams?.length || 0) +
    (filters.status ? 1 : 0);

  return (
    <Card className="p-sm">
      <div className="flex items-center gap-md">
        {/* Compact row - always visible */}
        <div className="flex items-center gap-sm flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-sm top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.search || ""}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search by name, URL, campaign..."
              className="h-8 pl-8 text-body-sm"
            />
          </div>

          <Select
            value={filters.campaign_name?.length === 1 ? filters.campaign_name[0] : "all"}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, campaign_name: value === "all" ? [] : [value] })
            }
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
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
            {activeFilterCount > 3 && (
              <Badge variant="default" className="h-5 px-1.5">
                {activeFilterCount - 3}
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
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-xs" />
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
              <SimpleMultiSelect
                options={platforms.map(p => ({ value: p.name, label: p.name }))}
                selected={filters.platform || []}
                onChange={(selected) => onFiltersChange({ ...filters, platform: selected })}
                placeholder="All platforms"
              />
            </div>

            <div className="space-y-sm">
              <label className="text-body-sm font-medium">LP Type</label>
              <Select
                value={filters.lp_type || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, lp_type: value === "all" ? undefined : value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All LP types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All LP types</SelectItem>
                  {LP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-sm">
              <label className="text-body-sm font-medium">Link Purpose</label>
              <SimpleMultiSelect
                options={LINK_PURPOSES.map(p => ({ value: p, label: p }))}
                selected={filters.link_purpose || []}
                onChange={(selected) => onFiltersChange({ ...filters, link_purpose: selected })}
                placeholder="All purposes"
              />
            </div>

            <div className="space-y-sm">
              <label className="text-body-sm font-medium">Entity</label>
              <SimpleMultiSelect
                options={ENTITIES.map(e => ({ value: e, label: e }))}
                selected={filters.entity || []}
                onChange={(selected) => onFiltersChange({ ...filters, entity: selected })}
                placeholder="All entities"
              />
            </div>

            <div className="space-y-sm">
              <label className="text-body-sm font-medium">Team</label>
              <SimpleMultiSelect
                options={TEAMS.map(t => ({ value: t, label: t }))}
                selected={filters.teams || []}
                onChange={(selected) => onFiltersChange({ ...filters, teams: selected })}
                placeholder="All teams"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
