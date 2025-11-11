import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface WebIntelFiltersState {
  search: string;
  countries: string[];
  types: string[];
  categories: string[];
  tags: string[];
  entities: string[];
}

interface WebIntelFiltersProps {
  filters: WebIntelFiltersState;
  onFiltersChange: (filters: WebIntelFiltersState) => void;
  availableCountries: string[];
  availableCategories: string[];
  availableTags: string[];
  availableEntities: string[];
}

const SITE_TYPES = ['Website', 'App', 'Portal', 'Forum'];

export function WebIntelFilters({
  filters,
  onFiltersChange,
  availableCountries,
  availableCategories,
  availableTags,
  availableEntities,
}: WebIntelFiltersProps) {
  const hasActiveFilters = 
    filters.search || 
    filters.countries.length > 0 || 
    filters.types.length > 0 || 
    filters.categories.length > 0 || 
    filters.tags.length > 0 ||
    filters.entities.length > 0;

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      countries: [],
      types: [],
      categories: [],
      tags: [],
      entities: [],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Search sites, URLs, or publishers..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="max-w-sm"
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>
      
      {hasActiveFilters && (
        <div className="flex gap-2 flex-wrap">
          {filters.countries.map(c => (
            <Badge key={c} variant="secondary">
              {c}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, countries: filters.countries.filter(x => x !== c) })}
              />
            </Badge>
          ))}
          {filters.types.map(t => (
            <Badge key={t} variant="secondary">
              {t}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, types: filters.types.filter(x => x !== t) })}
              />
            </Badge>
          ))}
          {filters.categories.map(c => (
            <Badge key={c} variant="secondary">
              {c}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, categories: filters.categories.filter(x => x !== c) })}
              />
            </Badge>
          ))}
          {filters.tags.map(t => (
            <Badge key={t} variant="secondary">
              {t}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, tags: filters.tags.filter(x => x !== t) })}
              />
            </Badge>
          ))}
          {filters.entities.map(e => (
            <Badge key={e} variant="secondary">
              {e}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, entities: filters.entities.filter(x => x !== e) })}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
