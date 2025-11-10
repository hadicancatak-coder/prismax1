import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SavedAdsManagerProps {
  onSelectAd?: (adId: string) => void;
}

export function SavedAdsManager({ onSelectAd }: SavedAdsManagerProps) {
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  const { data: savedAds, isLoading } = useQuery({
    queryKey: ['saved-ads-manager'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_ads_library')
        .select('*')
        .order('entity', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const groupedByEntity = savedAds?.reduce((acc, ad) => {
    const entity = ad.entity || 'Uncategorized';
    if (!acc[entity]) acc[entity] = [];
    acc[entity].push(ad);
    return acc;
  }, {} as Record<string, typeof savedAds>);

  const toggleEntity = (entity: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev);
      if (next.has(entity)) {
        next.delete(entity);
      } else {
        next.add(entity);
      }
      return next;
    });
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading saved ads...</div>;
  }

  if (!savedAds || savedAds.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No saved ads yet
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {Object.entries(groupedByEntity || {}).map(([entity, ads]) => {
          const isExpanded = expandedEntities.has(entity);
          
          return (
            <Collapsible key={entity} open={isExpanded} onOpenChange={() => toggleEntity(entity)}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-8 px-2 hover:bg-accent"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Bookmark className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-medium">{entity}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {ads.length}
                  </Badge>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1 mt-1">
                {ads.map((ad) => (
                  <Button
                    key={ad.id}
                    variant="ghost"
                    className="w-full justify-start h-8 px-2 text-xs hover:bg-accent"
                    onClick={() => onSelectAd?.(ad.id)}
                  >
                    <span className="truncate">{ad.name}</span>
                    {ad.ad_type && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {ad.ad_type}
                      </Badge>
                    )}
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </ScrollArea>
  );
}
