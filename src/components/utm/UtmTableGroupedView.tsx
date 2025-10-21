import { useState } from "react";
import { ChevronRight, ChevronDown, Copy, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteUtmLink } from "@/hooks/useUtmLinks";
import { toast } from "sonner";
import { UtmLink } from "@/hooks/useUtmLinks";
import { format } from "date-fns";

interface UtmTableGroupedViewProps {
  links: UtmLink[];
}

interface GroupedLinks {
  groupKey: string;
  campaign: string;
  platform: string;
  monthYear: string;
  links: UtmLink[];
  entityBreakdown: Record<string, number>;
}

export function UtmTableGroupedView({ links }: UtmTableGroupedViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteUtmLink = useDeleteUtmLink();

  // Group links by expansion_group_id or by campaign + platform + month
  const groupedLinks: GroupedLinks[] = (() => {
    const groups = new Map<string, GroupedLinks>();

    links.forEach((link) => {
      const monthYear = format(new Date(link.created_at), "MMM yyyy");
      const groupKey = link.expansion_group_id || 
        `${link.utm_campaign}_${link.utm_source}_${monthYear}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          groupKey,
          campaign: link.utm_campaign,
          platform: link.utm_source,
          monthYear,
          links: [],
          entityBreakdown: {},
        });
      }

      const group = groups.get(groupKey)!;
      group.links.push(link);

      // Count entities
      const entities = link.entity || [];
      entities.forEach((entity) => {
        group.entityBreakdown[entity] = (group.entityBreakdown[entity] || 0) + 1;
      });
    });

    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.links[0].created_at).getTime() - new Date(a.links[0].created_at).getTime()
    );
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

  const toggleLink = (linkId: string) => {
    setExpandedLinks((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) {
        next.delete(linkId);
      } else {
        next.add(linkId);
      }
      return next;
    });
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteUtmLink.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
        },
      });
    }
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No UTM links found. Create your first link in the Builder tab.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 p-3"></th>
              <th className="text-left p-3 font-medium">Campaign / Link Name</th>
              <th className="text-left p-3 font-medium">Platform</th>
              <th className="text-left p-3 font-medium">Entity</th>
              <th className="text-left p-3 font-medium">Language</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedLinks.map((group) => {
              const isGroupExpanded = expandedGroups.has(group.groupKey);
              const entitySummary = Object.entries(group.entityBreakdown)
                .map(([entity, count]) => `${entity} (${count})`)
                .join(", ");

              return (
                <>
                  {/* Parent Group Row */}
                  <tr
                    key={group.groupKey}
                    className="border-b bg-muted/30 hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleGroup(group.groupKey)}
                  >
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        {isGroupExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                    <td className="p-3 font-semibold">{group.campaign}</td>
                    <td className="p-3">
                      <Badge variant="outline">{group.platform}</Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground" colSpan={2}>
                      {entitySummary}
                    </td>
                    <td className="p-3 text-sm">{group.monthYear}</td>
                    <td className="p-3 text-right text-sm text-muted-foreground">
                      {group.links.length} {group.links.length === 1 ? "link" : "links"}
                    </td>
                  </tr>

                  {/* Child Link Rows */}
                  {isGroupExpanded &&
                    group.links.map((link) => {
                      const isLinkExpanded = expandedLinks.has(link.id);

                      return (
                        <>
                          <tr
                            key={link.id}
                            className="border-b hover:bg-muted/20"
                          >
                            <td className="p-3 pl-8">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLink(link.id);
                                }}
                              >
                                {isLinkExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </Button>
                            </td>
                            <td className="p-3 text-sm">{link.name}</td>
                            <td className="p-3">
                              <Badge variant="secondary" className="text-xs">
                                {link.utm_source}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              {link.entity && link.entity.length > 0 ? link.entity.join(", ") : "-"}
                            </td>
                            <td className="p-3 text-sm">{link.dynamic_language || "-"}</td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {format(new Date(link.created_at), "MMM d, yyyy")}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(link.full_url);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(link.full_url, "_blank");
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(link.id);
                                  }}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded URL Sub-Row */}
                          {isLinkExpanded && (
                            <tr className="border-b bg-muted/10">
                              <td colSpan={7} className="p-3 pl-16">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-muted-foreground">
                                    URL:
                                  </span>
                                  <code className="flex-1 bg-muted px-2 py-1 rounded text-xs break-all">
                                    {link.full_url}
                                  </code>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy(link.full_url)}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(link.full_url, "_blank")}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Open
                                  </Button>
                                </div>
                                {link.notes && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    <span className="font-medium">Notes:</span> {link.notes}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
