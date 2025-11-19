import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleMultiSelect } from "@/components/utm/SimpleMultiSelect";
import { FilterPanel } from "@/components/ui/filter-panel";
import { LocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { X } from "lucide-react";

export interface LocationFilters {
  cities: string[];
  agencies: string[];
  categories: LocationCategory[];
  campaignId?: string;
}

interface LocationFiltersProps {
  filters: LocationFilters;
  onFiltersChange: (filters: LocationFilters) => void;
  availableCities: string[];
  availableAgencies: string[];
  availableCampaigns: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
}

export function LocationFilters({
  filters,
  onFiltersChange,
  availableCities,
  availableAgencies,
  availableCampaigns,
  isOpen,
  onClose,
}: LocationFiltersProps) {
  const hasActiveFilters =
    filters.cities.length > 0 ||
    filters.agencies.length > 0 ||
    filters.categories.length > 0 ||
    filters.campaignId;

  const activeFilterCount = 
    filters.cities.length + 
    filters.agencies.length + 
    filters.categories.length +
    (filters.campaignId ? 1 : 0);

  const handleClearFilters = () => {
    onFiltersChange({
      cities: [],
      agencies: [],
      categories: [],
      campaignId: undefined,
    });
  };

  return (
    <FilterPanel isOpen={isOpen} onClose={onClose} title="Location Filters">
      <div className="space-y-6">
        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-sm text-muted-foreground">
              {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Cities */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cities</label>
          <SimpleMultiSelect
            options={availableCities.map(c => ({ value: c, label: c }))}
            selected={filters.cities}
            onChange={(cities) => onFiltersChange({ ...filters, cities })}
            placeholder="Select cities..."
          />
        </div>

        {/* Agencies */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Agencies</label>
          <SimpleMultiSelect
            options={availableAgencies.map(a => ({ value: a, label: a }))}
            selected={filters.agencies}
            onChange={(agencies) => onFiltersChange({ ...filters, agencies })}
            placeholder="Select agencies..."
          />
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categories</label>
          <SimpleMultiSelect
            options={Object.keys(LOCATION_CATEGORIES).map(c => ({ value: c, label: c }))}
            selected={filters.categories}
            onChange={(categories) => onFiltersChange({ ...filters, categories: categories as LocationCategory[] })}
            placeholder="Select categories..."
          />
        </div>

        {/* Campaign Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Campaign</label>
          <Select
            value={filters.campaignId || "all"}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, campaignId: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {availableCampaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-2 pt-4 border-t">
            <label className="text-sm font-medium">Active Filters</label>
            <div className="flex flex-wrap gap-2">
              {filters.cities.map((city) => (
                <Badge key={city} variant="secondary" className="gap-1">
                  {city}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onFiltersChange({
                      ...filters,
                      cities: filters.cities.filter((c) => c !== city)
                    })}
                  />
                </Badge>
              ))}
              {filters.agencies.map((agency) => (
                <Badge key={agency} variant="secondary" className="gap-1">
                  {agency}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onFiltersChange({
                      ...filters,
                      agencies: filters.agencies.filter((a) => a !== agency)
                    })}
                  />
                </Badge>
              ))}
              {filters.categories.map((category) => (
                <Badge key={category} variant="secondary" className="gap-1">
                  {category}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onFiltersChange({
                      ...filters,
                      categories: filters.categories.filter((c) => c !== category)
                    })}
                  />
                </Badge>
              ))}
              {filters.campaignId && (
                <Badge variant="secondary" className="gap-1">
                  Campaign
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => onFiltersChange({ ...filters, campaignId: undefined })}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </FilterPanel>
  );
}
