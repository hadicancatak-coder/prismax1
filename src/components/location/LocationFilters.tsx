import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleMultiSelect } from "@/components/utm/SimpleMultiSelect";
import { LocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

export interface LocationFilters {
  cities: string[];
  agencies: string[];
  categories: LocationCategory[];
  campaignId?: string;
  priceRange: { min: number; max: number };
  scoreRange: { min: number; max: number };
}

interface LocationFiltersProps {
  filters: LocationFilters;
  onFiltersChange: (filters: LocationFilters) => void;
  availableCities: string[];
  availableAgencies: string[];
  availableCampaigns: Array<{ id: string; name: string }>;
}

export function LocationFilters({
  filters,
  onFiltersChange,
  availableCities,
  availableAgencies,
  availableCampaigns,
}: LocationFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.cities.length > 0 ||
    filters.agencies.length > 0 ||
    filters.categories.length > 0 ||
    filters.campaignId ||
    filters.priceRange.min > 0 ||
    filters.priceRange.max < 1000000 ||
    filters.scoreRange.min > 0 ||
    filters.scoreRange.max < 10;

  const activeFilterCount = 
    filters.cities.length + 
    filters.agencies.length + 
    filters.categories.length +
    (filters.campaignId ? 1 : 0) +
    (filters.priceRange.min > 0 ? 1 : 0) +
    (filters.priceRange.max < 1000000 ? 1 : 0) +
    (filters.scoreRange.min > 0 ? 1 : 0) +
    (filters.scoreRange.max < 10 ? 1 : 0);

  const handleClearFilters = () => {
    onFiltersChange({
      cities: [],
      agencies: [],
      categories: [],
      campaignId: undefined,
      priceRange: { min: 0, max: 1000000 },
      scoreRange: { min: 0, max: 10 },
    });
  };

  const toggleCity = (city: string) => {
    const newCities = filters.cities.includes(city)
      ? filters.cities.filter((c) => c !== city)
      : [...filters.cities, city];
    onFiltersChange({ ...filters, cities: newCities });
  };

  return (
    <Card className="p-2">
      <div className="flex items-center gap-4">
        {/* Compact row - always visible */}
        <div className="flex items-center gap-2 flex-1">
          <Select
            value={filters.cities.length === 1 ? filters.cities[0] : "all"}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, cities: value === "all" ? [] : [value] })
            }
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.agencies.length === 1 ? filters.agencies[0] : "all"}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, agencies: value === "all" ? [] : [value] })
            }
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Agency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agencies</SelectItem>
              {availableAgencies.map((agency) => (
                <SelectItem key={agency} value={agency}>
                  {agency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.categories.length === 1 ? filters.categories[0] : "all"}
            onValueChange={(value) => 
              onFiltersChange({ ...filters, categories: value === "all" ? [] : [value as LocationCategory] })
            }
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(LOCATION_CATEGORIES).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
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
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Expanded section */}
      {isExpanded && (
        <div className="pt-3 mt-3 border-t space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cities (Multiple)</label>
              <SimpleMultiSelect
                options={availableCities.map(c => ({ value: c, label: c }))}
                selected={filters.cities}
                onChange={(selected) => onFiltersChange({ ...filters, cities: selected })}
                placeholder="Select cities"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Agencies (Multiple)</label>
              <SimpleMultiSelect
                options={availableAgencies.map(a => ({ value: a, label: a }))}
                selected={filters.agencies}
                onChange={(selected) => onFiltersChange({ ...filters, agencies: selected })}
                placeholder="Select agencies"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categories (Multiple)</label>
              <SimpleMultiSelect
                options={Object.keys(LOCATION_CATEGORIES).map(c => ({ value: c, label: c }))}
                selected={filters.categories}
                onChange={(selected) => onFiltersChange({ ...filters, categories: selected as LocationCategory[] })}
                placeholder="Select categories"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price Range ($)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      priceRange: { ...filters.priceRange, min: Number(e.target.value) },
                    })
                  }
                  className="h-8 text-sm"
                  placeholder="Min"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      priceRange: { ...filters.priceRange, max: Number(e.target.value) },
                    })
                  }
                  className="h-8 text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Score Range</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={filters.scoreRange.min}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      scoreRange: { ...filters.scoreRange, min: Number(e.target.value) },
                    })
                  }
                  className="h-8 text-sm"
                  placeholder="Min"
                  step="0.1"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  value={filters.scoreRange.max}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      scoreRange: { ...filters.scoreRange, max: Number(e.target.value) },
                    })
                  }
                  className="h-8 text-sm"
                  placeholder="Max"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
