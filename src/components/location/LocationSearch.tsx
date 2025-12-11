import { useState, useEffect, useCallback } from "react";
import { MediaLocation, getLocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";

interface LocationSearchProps {
  locations: MediaLocation[];
  onLocationSelect: (location: MediaLocation) => void;
}

export function LocationSearch({ locations, onLocationSelect }: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search and rank locations
  const searchResults = useCallback(() => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();
    const results = locations
      .map((location) => {
        let score = 0;
        const name = location.name.toLowerCase();
        const city = location.city.toLowerCase();
        const type = location.type.toLowerCase();
        const agency = (location.agency || "").toLowerCase();
        const notes = (location.notes || "").toLowerCase();

        // Scoring logic
        if (name === query) score += 100; // Exact match
        else if (name.startsWith(query)) score += 50; // Starts with
        else if (name.includes(query)) score += 25; // Contains

        if (city.includes(query)) score += 15;
        if (type.includes(query)) score += 10;
        if (agency.includes(query)) score += 5;
        if (notes.includes(query)) score += 2;

        return { location, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10 results

    return results.map(({ location }) => location);
  }, [locations, searchQuery]);

  const results = searchResults();

  const handleSelect = (location: MediaLocation) => {
    onLocationSelect(location);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full max-w-sm justify-start text-muted-foreground bg-background/90 backdrop-blur-md shadow-xl border border-white/10">
          <Search className="mr-2 h-4 w-4" />
          Search locations...
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-xs rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-metadata">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search by name, city, type, or agency..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery ? "No locations found." : "Start typing to search..."}
            </CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading={`${results.length} result${results.length > 1 ? 's' : ''}`}>
                {results.map((location) => {
                  const category = getLocationCategory(location.type);
                  const categoryConfig = category ? LOCATION_CATEGORIES[category] : null;
                  
                  return (
                    <CommandItem
                      key={location.id}
                      value={location.id}
                      onSelect={() => handleSelect(location)}
                      className="cursor-pointer"
                    >
                      <MapPin className="mr-sm h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-sm">
                          {categoryConfig && (
                            <span className="text-body-sm">{categoryConfig.emoji}</span>
                          )}
                          <span className="font-medium truncate">{location.name}</span>
                        </div>
                        <span className="text-metadata text-muted-foreground truncate">
                          {location.type} • {location.city}
                          {location.agency && ` • ${location.agency}`}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
