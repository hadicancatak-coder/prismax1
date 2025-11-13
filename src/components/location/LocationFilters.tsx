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
  priceRange: { min: number; max: number };
  scoreRange: { min: number; max: number };
}

interface LocationFiltersProps {
  filters: LocationFilters;
  onFiltersChange: (filters: LocationFilters) => void;
  availableCities: string[];
  availableAgencies: string[];
}

export function LocationFilters({
  filters,
  onFiltersChange,
  availableCities,
  availableAgencies,
}: LocationFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.cities.length > 0 ||
    filters.agencies.length > 0 ||
    filters.categories.length > 0 ||
    filters.priceRange.min > 0 ||
    filters.priceRange.max < 1000000 ||
    filters.scoreRange.min > 0 ||
    filters.scoreRange.max < 10;

  const activeFilterCount = 
    filters.cities.length + 
    filters.agencies.length + 
    filters.categories.length +
    (filters.priceRange.min > 0 ? 1 : 0) +
    (filters.priceRange.max < 1000000 ? 1 : 0) +
    (filters.scoreRange.min > 0 ? 1 : 0) +
    (filters.scoreRange.max < 10 ? 1 : 0);

  const handleClearFilters = () => {
    onFiltersChange({
      cities: [],
      agencies: [],
      categories: [],
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
    <Card className="p-3">
      {/* Collapsed View */}
      {!isExpanded && (
        <div className="flex items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(true)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 ? (
              <Badge variant="default" className="h-5 px-1.5">
                {activeFilterCount}
              </Badge>
            ) : (
              "Filters"
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Filters</h3>
              {activeFilterCount > 0 && (
                <Badge variant="default" className="h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(false)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cities */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cities</Label>
              <div className="flex flex-wrap gap-1">
                {availableCities.map((city) => (
                  <Badge
                    key={city}
                    variant={filters.cities.includes(city) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleCity(city)}
                  >
                    {city}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Agencies */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Agencies</Label>
              <SimpleMultiSelect
                options={availableAgencies.map((a) => ({ value: a, label: a }))}
                selected={filters.agencies}
                onChange={(agencies) => onFiltersChange({ ...filters, agencies })}
                placeholder="Select agencies"
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Categories</Label>
              <SimpleMultiSelect
                options={Object.entries(LOCATION_CATEGORIES).map(([key, config]) => ({
                  value: key,
                  label: `${config.emoji} ${key}`,
                }))}
                selected={filters.categories}
                onChange={(categories) =>
                  onFiltersChange({ ...filters, categories: categories as LocationCategory[] })
                }
                placeholder="Select categories"
              />
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Price (AED/month)</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      priceRange: { ...filters.priceRange, min: Number(e.target.value) },
                    })
                  }
                  className="h-8 text-xs"
                  placeholder="Min"
                />
                <span className="text-xs">-</span>
                <Input
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      priceRange: { ...filters.priceRange, max: Number(e.target.value) },
                    })
                  }
                  className="h-8 text-xs"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Score Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Score Range</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.scoreRange.min}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      scoreRange: { ...filters.scoreRange, min: Number(e.target.value) },
                    })
                  }
                  className="h-8 text-xs"
                  placeholder="Min"
                />
                <span className="text-xs">-</span>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.scoreRange.max}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      scoreRange: { ...filters.scoreRange, max: Number(e.target.value) },
                    })
                  }
                  className="h-8 text-xs"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
