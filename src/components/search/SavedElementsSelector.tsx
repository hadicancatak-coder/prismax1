import { useState } from "react";
import { useAdElements } from "@/hooks/useAdElements";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SavedElementsSelectorProps {
  elementType: "headline" | "description" | "sitelink" | "callout";
  entity?: string;
  language?: string;
  onSelect: (content: string) => void;
  trigger?: React.ReactNode;
}

export function SavedElementsSelector({ 
  elementType, 
  entity, 
  language = "EN", 
  onSelect,
  trigger
}: SavedElementsSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: elements = [] } = useAdElements({
    elementType,
    entity,
    language,
    search,
    googleStatus: "approved"
  });

  const handleSelect = (content: string) => {
    onSelect(content);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            className="h-8"
          >
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Use Saved
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Saved {elementType}s</h4>
            <Badge variant="outline" className="text-xs">
              {elements.length} available
            </Badge>
          </div>
          <Input
            placeholder={`Search ${elementType}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-80">
          <div className="p-2 space-y-1">
            {elements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No saved {elementType}s found
              </div>
            ) : (
              elements.map((element) => {
                const content = typeof element.content === 'string' 
                  ? element.content 
                  : element.content?.text || '';

                return (
                  <button
                    key={element.id}
                    onClick={() => handleSelect(content)}
                    className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-tight break-words">{content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {element.use_count > 0 && (
                            <Badge variant="secondary" className="text-xs h-4">
                              Used {element.use_count}x
                            </Badge>
                          )}
                          {element.google_status && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs h-4 ${
                                element.google_status === 'approved' 
                                  ? 'border-green-500/20 bg-green-500/10 text-green-700' 
                                  : ''
                              }`}
                            >
                              {element.google_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
