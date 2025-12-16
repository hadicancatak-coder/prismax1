import React, { useState } from "react";
import { ChevronRight, ChevronDown, Copy, ExternalLink, Trash2, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useDeleteUtmLink, useUpdateUtmLink } from "@/hooks/useUtmLinks";
import { toast } from "sonner";
import { UtmLink } from "@/hooks/useUtmLinks";
import { format } from "date-fns";
import { UtmBulkActionsBar } from "./UtmBulkActionsBar";
import { exportUtmLinksToCSV } from "@/lib/utmExport";
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const deleteUtmLink = useDeleteUtmLink();
  const updateUtmLink = useUpdateUtmLink();

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

  const handleSelectAll = () => {
    if (selectedIds.size === links.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(links.map(l => l.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkExport = () => {
    const selectedLinks = links.filter(l => selectedIds.has(l.id));
    exportUtmLinksToCSV(selectedLinks, `utm-links-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success(`Exported ${selectedLinks.length} UTM links`);
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    for (const id of idsToDelete) {
      await deleteUtmLink.mutateAsync(id);
    }
    setSelectedIds(new Set());
    toast.success(`Deleted ${idsToDelete.length} UTM links`);
  };

  const handleBulkStatusChange = async (status: string) => {
    const idsToUpdate = Array.from(selectedIds);
    for (const id of idsToUpdate) {
      await updateUtmLink.mutateAsync({ id, status: status as "active" | "paused" | "archived" });
    }
    setSelectedIds(new Set());
    toast.success(`Updated status for ${idsToUpdate.length} UTM links`);
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-lg text-muted-foreground">
        No UTM links found. Create your first link in the Builder tab.
      </div>
    );
  }

  return (
    <>
      <UtmBulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onExport={handleBulkExport}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
      />
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 p-sm">
                <Checkbox
                  checked={selectedIds.size === links.length && links.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="text-left p-sm font-medium">Campaign</th>
              <th className="text-left p-sm font-medium">Platform</th>
              <th className="text-left p-sm font-medium">Purpose</th>
              <th className="text-left p-sm font-medium">Entity</th>
              <th className="text-left p-sm font-medium">Device</th>
              <th className="text-left p-sm font-medium">Date</th>
              <th className="text-right p-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedLinks.map((group) => {
              const isGroupExpanded = expandedGroups.has(group.groupKey);
              const entitySummary = Object.entries(group.entityBreakdown)
                .map(([entity, count]) => `${entity} (${count})`)
                .join(", ");

              return (
                <React.Fragment key={group.groupKey}>
                  {/* Parent Group Row */}
                  <tr
                    key={group.groupKey}
                    className="border-b bg-muted/30 hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleGroup(group.groupKey)}
                  >
                    <td className="p-sm">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                      >
                        {isGroupExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                    <td className="p-sm">
                      <Badge className="font-mono text-metadata">{group.campaign}</Badge>
                    </td>
                    <td className="p-sm">
                      <Badge variant="outline">{group.platform}</Badge>
                    </td>
                    <td className="p-sm text-body-sm text-muted-foreground" colSpan={3}>
                      {entitySummary}
                    </td>
                    <td className="p-sm text-body-sm">{group.monthYear}</td>
                    <td className="p-sm text-right text-body-sm text-muted-foreground">
                      {group.links.length} {group.links.length === 1 ? "link" : "links"}
                    </td>
                  </tr>

                  {/* Child Link Rows */}
                  {isGroupExpanded &&
                    group.links.map((link) => {
                      const isLinkExpanded = expandedLinks.has(link.id);

                      return (
                        <React.Fragment key={link.id}>
                          <tr
                            className="border-b hover:bg-muted/20"
                          >
                          <td className="p-sm pl-lg">
                              <div className="flex items-center gap-sm">
                                <Checkbox
                                  checked={selectedIds.has(link.id)}
                                  onCheckedChange={() => handleSelectOne(link.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLink(link.id);
                                  }}
                                >
                                  {isLinkExpanded ? (
                                    <ChevronDown />
                                  ) : (
                                    <ChevronRight />
                                  )}
                                </Button>
                              </div>
                            </td>
                            <td className="p-sm">
                              <Badge variant="outline" className="font-mono text-metadata">
                                {link.utm_campaign}
                              </Badge>
                            </td>
                            <td className="p-sm">
                              <Badge variant="secondary" className="text-metadata">
                                {link.utm_source}
                              </Badge>
                            </td>
                            <td className="p-sm">
                              {link.link_purpose && (
                                <Badge variant="default" className="text-metadata">
                                  {link.link_purpose}
                                </Badge>
                              )}
                            </td>
                            <td className="p-sm text-body-sm">
                              {link.entity && link.entity.length > 0 ? link.entity.join(", ") : "-"}
                            </td>
                            <td className="p-sm">
                              {link.utm_content?.includes('mobile') ? (
                                <Badge variant="outline" className="text-metadata">
                                  <Smartphone className="h-3 w-3 mr-xs" />
                                  Mobile
                                </Badge>
                              ) : link.utm_content?.includes('web') ? (
                                <Badge variant="outline" className="text-metadata">
                                  <Monitor className="h-3 w-3 mr-xs" />
                                  Web
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-metadata">-</span>
                              )}
                            </td>
                            <td className="p-sm text-body-sm text-muted-foreground">
                              {format(new Date(link.created_at), "MMM d, yyyy")}
                            </td>
                            <td className="p-sm">
                              <div className="flex items-center justify-end gap-xs">
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
                              <td colSpan={8} className="p-sm pl-lg">
                                <div className="flex items-center gap-sm text-body-sm">
                                  <span className="font-medium text-muted-foreground">
                                    URL:
                                  </span>
                                  <code className="flex-1 bg-muted px-sm py-xs rounded text-metadata break-all">
                                    {link.full_url}
                                  </code>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy(link.full_url)}
                                  >
                                    <Copy className="h-3 w-3 mr-xs" />
                                    Copy
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(link.full_url, "_blank")}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-xs" />
                                    Open
                                  </Button>
                                </div>
                                {link.notes && (
                                  <div className="mt-sm text-metadata text-muted-foreground">
                                    <span className="font-medium">Notes:</span> {link.notes}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
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
