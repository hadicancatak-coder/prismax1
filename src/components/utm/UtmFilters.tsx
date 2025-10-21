import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleMultiSelect } from "./SimpleMultiSelect";
import { ENTITIES, TEAMS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface UtmFiltersProps {
  filters: {
    entity?: string[];
    teams?: string[];
    campaign_type?: string;
    status?: string;
    search?: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const UtmFilters = ({ filters, onFiltersChange }: UtmFiltersProps) => {
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = 
    (filters.entity && filters.entity.length > 0) ||
    (filters.teams && filters.teams.length > 0) ||
    filters.campaign_type ||
    filters.status ||
    filters.search;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Filters</Label>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, URL, campaign..."
                value={filters.search || ""}
                onChange={(e) =>
                  onFiltersChange({ ...filters, search: e.target.value || undefined })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Entity</Label>
              <SimpleMultiSelect
                options={ENTITIES.map(e => ({ value: e, label: e }))}
                selected={filters.entity || []}
                onChange={(entity) =>
                  onFiltersChange({ ...filters, entity: entity.length > 0 ? entity : undefined })
                }
                placeholder="Filter by entity..."
              />
            </div>

            <div className="space-y-2">
              <Label>Team</Label>
              <SimpleMultiSelect
                options={TEAMS.map(t => ({ value: t, label: t }))}
                selected={filters.teams || []}
                onChange={(teams) =>
                  onFiltersChange({ ...filters, teams: teams.length > 0 ? teams : undefined })
                }
                placeholder="Filter by team..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaignType">Campaign Type</Label>
              <Select
                value={filters.campaign_type || "all"}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, campaign_type: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="paid_search">Paid Search</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="display">Display</SelectItem>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="organic">Organic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, status: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
