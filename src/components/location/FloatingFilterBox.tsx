import { useState } from "react";
import { ChevronDown, ChevronUp, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SimpleMultiSelect } from "@/components/utm/SimpleMultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationFilters {
  cities: string[];
  agencies: string[];
  categories: string[];
  campaignId?: string;
}

interface FloatingFilterBoxProps {
  filters: LocationFilters;
  onFiltersChange: (filters: LocationFilters) => void;
  availableCities: string[];
  availableAgencies: string[];
  campaigns: Array<{ id: string; name: string }>;
}

export function FloatingFilterBox({
  filters,
  onFiltersChange,
  availableCities,
  availableAgencies,
  campaigns,
}: FloatingFilterBoxProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleClearFilters = () => {
    onFiltersChange({
      cities: [],
      agencies: [],
      categories: [],
      campaignId: undefined,
    });
  };

  const activeFilterCount =
    filters.cities.length +
    filters.agencies.length +
    filters.categories.length +
    (filters.campaignId ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const categoryOptions = [
    { value: "billboards", label: "🪧 Billboards" },
    { value: "transit", label: "🚌 Transit" },
    { value: "street", label: "🚶 Street Furniture" },
    { value: "digital", label: "📱 Digital Screens" },
  ];

  return (
    <div className="absolute top-4 left-4 z-[100] w-80 max-w-[calc(100vw-2rem)]">
      <div className="relative rounded-xl border-2 border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl shadow-black/10 overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        {/* Header */}
        <div className="relative p-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="relative">
            <ScrollArea className="max-h-[calc(100vh-200px)]">
              <div className="p-4 space-y-4">
                {/* Cities Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cities</label>
                  <SimpleMultiSelect
                    options={availableCities.map((city) => ({
                      value: city,
                      label: city,
                    }))}
                    selected={filters.cities}
                    onChange={(cities) =>
                      onFiltersChange({ ...filters, cities })
                    }
                    placeholder="Select cities..."
                  />
                </div>

                {/* Agencies Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Agencies</label>
                  <SimpleMultiSelect
                    options={availableAgencies.map((agency) => ({
                      value: agency,
                      label: agency,
                    }))}
                    selected={filters.agencies}
                    onChange={(agencies) =>
                      onFiltersChange({ ...filters, agencies })
                    }
                    placeholder="Select agencies..."
                  />
                </div>

                {/* Categories Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Categories</label>
                  <SimpleMultiSelect
                    options={categoryOptions}
                    selected={filters.categories}
                    onChange={(categories) =>
                      onFiltersChange({ ...filters, categories })
                    }
                    placeholder="Select categories..."
                  />
                </div>

                {/* Campaign Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Campaign</label>
                  <Select
                    value={filters.campaignId || "all"}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        campaignId: value === "all" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All campaigns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All campaigns</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Active Filters
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {filters.cities.map((city) => (
                        <Badge
                          key={city}
                          variant="secondary"
                          className="text-xs px-2 py-0.5"
                        >
                          {city}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() =>
                              onFiltersChange({
                                ...filters,
                                cities: filters.cities.filter((c) => c !== city),
                              })
                            }
                          />
                        </Badge>
                      ))}
                      {filters.agencies.map((agency) => (
                        <Badge
                          key={agency}
                          variant="secondary"
                          className="text-xs px-2 py-0.5"
                        >
                          {agency}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() =>
                              onFiltersChange({
                                ...filters,
                                agencies: filters.agencies.filter(
                                  (a) => a !== agency
                                ),
                              })
                            }
                          />
                        </Badge>
                      ))}
                      {filters.categories.map((category) => {
                        const categoryOption = categoryOptions.find(
                          (opt) => opt.value === category
                        );
                        return (
                          <Badge
                            key={category}
                            variant="secondary"
                            className="text-xs px-2 py-0.5"
                          >
                            {categoryOption?.label || category}
                            <X
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() =>
                                onFiltersChange({
                                  ...filters,
                                  categories: filters.categories.filter(
                                    (c) => c !== category
                                  ),
                                })
                              }
                            />
                          </Badge>
                        );
                      })}
                      {filters.campaignId && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0.5"
                        >
                          {campaigns.find((c) => c.id === filters.campaignId)
                            ?.name || "Campaign"}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() =>
                              onFiltersChange({
                                ...filters,
                                campaignId: undefined,
                              })
                            }
                          />
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
