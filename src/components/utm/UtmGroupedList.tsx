import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Copy, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteUtmLink } from "@/hooks/useUtmLinks";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { UtmLink } from "@/hooks/useUtmLinks";

interface UtmGroupedListProps {
  links: UtmLink[];
}

interface GroupedLinks {
  groupKey: string;
  campaign: string;
  platform: string;
  monthYear: string;
  links: UtmLink[];
  expansionGroupId?: string;
}

export const UtmGroupedList = ({ links }: UtmGroupedListProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteUtmLink = useDeleteUtmLink();

  // Group links by expansion_group_id (if present) or by campaign+platform+month
  const groupedLinks: GroupedLinks[] = (() => {
    const groups = new Map<string, GroupedLinks>();

    links.forEach((link) => {
      let groupKey: string;
      
      // If link has expansion_group_id, use it as the primary grouping
      if (link.expansion_group_id) {
        groupKey = link.expansion_group_id;
      } else {
        // Fallback to campaign+platform+month grouping
        groupKey = `${link.campaign_name}_${link.platform}_${link.month_year}`;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          groupKey,
          campaign: link.campaign_name,
          platform: link.platform,
          monthYear: link.month_year || '',
          links: [],
          expansionGroupId: link.expansion_group_id || undefined,
        });
      }

      groups.get(groupKey)!.links.push(link);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const dateA = a.links[0]?.created_at || '';
      const dateB = b.links[0]?.created_at || '';
      return dateB.localeCompare(dateA);
    });
  })();

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const handleDelete = (id: string) => {
    deleteUtmLink.mutate(id, {
      onSuccess: () => {
        setDeleteId(null);
      },
    });
  };

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No UTM links found. Create your first link using the Builder tab.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {groupedLinks.map((group) => {
          const isExpanded = expandedGroups.has(group.groupKey);
          const entityCounts = group.links.reduce((acc, link) => {
            const entity = link.entity?.[0] || 'N/A';
            acc[entity] = (acc[entity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return (
            <Card key={group.groupKey} className="overflow-hidden">
              {/* Group Header - Collapsible */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleGroup(group.groupKey)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </Button>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{group.campaign}</span>
                      <Badge variant="outline">{group.platform}</Badge>
                      {group.monthYear && (
                        <Badge variant="secondary" className="text-xs">
                          {group.monthYear}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{group.links.length} links</span>
                      <span>•</span>
                      <div className="flex gap-1">
                        {Object.entries(entityCounts).map(([entity, count]) => (
                          <Badge key={entity} variant="outline" className="text-xs">
                            {entity} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{group.links[0]?.lp_type || 'N/A'}</Badge>
                </div>
              </div>

              {/* Expanded Content - Individual Links */}
              {isExpanded && (
                <div className="border-t">
                  <div className="divide-y">
                    {group.links.map((link) => (
                      <div key={link.id} className="p-4 hover:bg-muted/30">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{link.name}</span>
                              {link.entity?.[0] && (
                                <Badge variant="secondary">{link.entity[0]}</Badge>
                              )}
                              {link.dynamic_language && (
                                <Badge>{link.dynamic_language}</Badge>
                              )}
                            </div>
                            
                            <div className="font-mono text-xs bg-muted/50 p-2 rounded break-all">
                              {link.full_url}
                            </div>

                            {link.notes && (
                              <p className="text-sm text-muted-foreground">{link.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(link.full_url);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(link.full_url, '_blank');
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(link.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete UTM Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this link? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
