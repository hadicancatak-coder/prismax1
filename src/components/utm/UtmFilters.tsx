import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SimpleMultiSelect } from "./SimpleMultiSelect";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { ENTITIES, TEAMS } from "@/lib/constants";
import { Search, X } from "lucide-react";
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

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && (Array.isArray(value) ? value.length > 0 : value !== "")
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filters</CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              value={filters.search || ""}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search by name, URL, campaign..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Campaign */}
        <div className="space-y-2">
          <Label>Campaign</Label>
          <SimpleMultiSelect
            options={campaigns.map(c => ({ value: c.name, label: c.name }))}
            selected={filters.campaign_name || []}
            onChange={(selected) => onFiltersChange({ ...filters, campaign_name: selected })}
            placeholder="All campaigns"
          />
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <Label>Platform</Label>
          <SimpleMultiSelect
            options={platforms.map(p => ({ value: p.name, label: p.name }))}
            selected={filters.platform || []}
            onChange={(selected) => onFiltersChange({ ...filters, platform: selected })}
            placeholder="All platforms"
          />
        </div>

        {/* LP Type */}
        <div className="space-y-2">
          <Label>LP Type</Label>
          <Select
            value={filters.lp_type || ""}
            onValueChange={(value) => onFiltersChange({ ...filters, lp_type: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All LP types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All LP types</SelectItem>
              {LP_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Link Purpose */}
        <div className="space-y-2">
          <Label>Link Purpose</Label>
          <SimpleMultiSelect
            options={LINK_PURPOSES.map(p => ({ value: p, label: p }))}
            selected={filters.link_purpose || []}
            onChange={(selected) => onFiltersChange({ ...filters, link_purpose: selected })}
            placeholder="All purposes"
          />
        </div>

        {/* Entity */}
        <div className="space-y-2">
          <Label>Entity</Label>
          <SimpleMultiSelect
            options={ENTITIES.map(e => ({ value: e, label: e }))}
            selected={filters.entity || []}
            onChange={(selected) => onFiltersChange({ ...filters, entity: selected })}
            placeholder="All entities"
          />
        </div>

        {/* Team */}
        <div className="space-y-2">
          <Label>Team</Label>
          <SimpleMultiSelect
            options={TEAMS.map(t => ({ value: t, label: t }))}
            selected={filters.teams || []}
            onChange={(selected) => onFiltersChange({ ...filters, teams: selected })}
            placeholder="All teams"
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status || ""}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
