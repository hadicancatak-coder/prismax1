import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { EnhancedMultiSelect } from "@/components/utm/EnhancedMultiSelect";
import { StatusLogFilters as Filters } from "@/lib/statusLogService";

interface StatusLogFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function StatusLogFilters({ filters, onFiltersChange }: StatusLogFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: entities = [] } = useSystemEntities();
  const { data: platforms = [] } = useUtmPlatforms();
  const { data: campaigns = [] } = useUtmCampaigns();

  const activeFiltersCount = [
    filters.entity?.length,
    filters.platform,
    filters.campaign_name,
    filters.status,
    filters.log_type?.length
  ].filter(Boolean).length;

  return (
    <div className="bg-card rounded-lg border">
      {/* Compact Row */}
      <div className="flex items-center gap-2 p-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={filters.search || ""}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="h-8 pl-8 text-sm"
          />
        </div>

        <Select
          value={filters.platform || "all"}
          onValueChange={(platform) => onFiltersChange({ ...filters, platform: platform === "all" ? undefined : platform })}
        >
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.campaign_name || "all"}
          onValueChange={(campaign_name) => onFiltersChange({ ...filters, campaign_name: campaign_name === "all" ? undefined : campaign_name })}
        >
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={(status) => onFiltersChange({ ...filters, status: status === "all" ? undefined : status })}
        >
          <SelectTrigger className="h-8 w-28 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 gap-1.5 text-sm"
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="border-t p-3 space-y-3">
          <div>
            <Label className="text-xs">Entities</Label>
            <EnhancedMultiSelect
              options={entities.map(e => ({ value: e.name, label: e.name }))}
              selected={filters.entity || []}
              onChange={(entity) => onFiltersChange({ ...filters, entity })}
              placeholder="All entities"
            />
          </div>

          <div>
            <Label className="text-xs">Log Type</Label>
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {['issue', 'blocker', 'plan', 'update', 'note'].map((type) => (
                <Badge
                  key={type}
                  variant={filters.log_type?.includes(type) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-accent text-xs h-7"
                  onClick={() => {
                    const current = Array.isArray(filters.log_type) ? filters.log_type : [];
                    const updated = current.includes(type)
                      ? current.filter(t => t !== type)
                      : [...current, type];
                    onFiltersChange({ ...filters, log_type: updated.length > 0 ? updated as any : undefined });
                  }}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
