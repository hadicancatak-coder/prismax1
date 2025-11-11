import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimpleMultiSelect } from "@/components/utm/SimpleMultiSelect";
import { LocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { X } from "lucide-react";

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
  const hasActiveFilters =
    filters.cities.length > 0 ||
    filters.agencies.length > 0 ||
    filters.categories.length > 0 ||
    filters.priceRange.min > 0 ||
    filters.priceRange.max < 1000000 ||
    filters.scoreRange.min > 0 ||
    filters.scoreRange.max < 10;

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
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Cities */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Cities</Label>
          <div className="flex flex-wrap gap-2">
            {availableCities.map((city) => (
              <Badge
                key={city}
                variant={filters.cities.includes(city) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleCity(city)}
              >
                {city}
              </Badge>
            ))}
          </div>
        </div>

        {/* Agencies */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Agencies</Label>
          <SimpleMultiSelect
            options={availableAgencies.map((a) => ({ value: a, label: a }))}
            selected={filters.agencies}
            onChange={(agencies) => onFiltersChange({ ...filters, agencies })}
            placeholder="Select agencies"
          />
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Location Categories</Label>
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
          <Label className="text-sm font-medium">Price Range (AED/month)</Label>
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
              className="w-24"
              placeholder="Min"
            />
            <span>-</span>
            <Input
              type="number"
              value={filters.priceRange.max}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  priceRange: { ...filters.priceRange, max: Number(e.target.value) },
                })
              }
              className="w-24"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Score Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Manual Score Range</Label>
          <div className="flex items-center gap-2">
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
              className="w-20"
              placeholder="Min"
            />
            <span>-</span>
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
              className="w-20"
              placeholder="Max"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
