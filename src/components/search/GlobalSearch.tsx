import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  entity_type: string;
  category: string;
  workspace_id?: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem("recentSearches");
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Search functionality with Supabase
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchContent = async () => {
      const { data } = await supabase.rpc('search_content' as any, {
        query_text: query,
        limit_results: 20
      });

      if (data) {
        setResults(data as any);
      }
    };

    const debounce = setTimeout(searchContent, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (url: string, title: string) => {
    // Save to recent searches
    const updated = [title, ...recentSearches.filter((s) => s !== title)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    navigate(url);
    setOpen(false);
    setQuery("");
  };

  const getEntityIcon = (type: string) => {
    const icons: Record<string, string> = {
      task: "✓",
      utm_link: "🔗",
      campaign: "📢",
      report: "📊",
      status_log: "📝",
      location: "📍",
      ad: "📱"
    };
    return icons[type] || "📄";
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Tasks: "✓",
      Marketing: "📢",
      Reports: "📊",
      Operations: "⚙️",
      Locations: "📍"
    };
    return icons[category] || "📁";
  };

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md mx-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search... (⌘K)"
            className="pl-10 pr-4 bg-muted/50 border-border/60 focus:bg-background transition-smooth"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-card z-50" align="center">
        <Command>
          <CommandList>
            {!query && recentSearches.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((search, idx) => (
                  <CommandItem
                    key={idx}
                    onSelect={() => setQuery(search)}
                    className="cursor-pointer"
                  >
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    {search}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {query && results.length === 0 && (
              <CommandEmpty>No results found for "{query}"</CommandEmpty>
            )}

            {results.length > 0 && (
              <CommandGroup heading="Results">
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result.url, result.title)}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">{getEntityIcon(result.entity_type)}</span>
                    <div className="flex-1">
                      <div className="font-medium">{result.title}</div>
                      {result.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {result.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
