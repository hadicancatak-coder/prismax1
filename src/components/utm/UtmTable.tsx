import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, ExternalLink, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useDeleteUtmLink, useUpdateUtmLink, type UtmLink } from "@/hooks/useUtmLinks";
import { format } from "date-fns";
import { UtmBulkActionsBar } from "./UtmBulkActionsBar";
import { exportUtmLinksToCSV } from "@/lib/utmExport";

interface UtmTableProps {
  links: UtmLink[];
}

export const UtmTable = ({ links }: UtmTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const deleteUtmLink = useDeleteUtmLink();
  const updateUtmLink = useUpdateUtmLink();

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteUtmLink.mutateAsync(deleteId);
      setDeleteId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "paused":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "archived":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case "AO":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "Seminar":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "Webinar":
        return "bg-pink-500/10 text-pink-700 dark:text-pink-400";
      case "Education":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No UTM links found. Create your first link to get started!
      </div>
    );
  }

  const handleBulkExport = () => {
    const selected = links.filter(l => selectedIds.has(l.id));
    exportUtmLinksToCSV(selected, `utm-links-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success(`Exported ${selected.length} links`);
  };

  const handleBulkDelete = async () => {
    for (const id of Array.from(selectedIds)) {
      await deleteUtmLink.mutateAsync(id);
    }
    setSelectedIds(new Set());
    toast.success(`Deleted ${selectedIds.size} links`);
  };

  const handleBulkStatusChange = async (status: string) => {
    for (const id of Array.from(selectedIds)) {
      await updateUtmLink.mutateAsync({ id, status: status as "active" | "paused" | "archived" });
    }
    setSelectedIds(new Set());
    toast.success(`Updated ${selectedIds.size} links`);
  };

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === links.length && links.length > 0}
                  onCheckedChange={() => {
                    if (selectedIds.size === links.length) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(links.map(l => l.id)));
                    }
                  }}
                />
              </TableHead>
              <TableHead>Link Name</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>LP Type</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>UTM Medium</TableHead>
              <TableHead>Month/Year</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Validated</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id} className="hover:bg-muted/50 transition-smooth">
                <TableCell className="font-medium">
                  <div className="max-w-[200px]">
                    <div className="truncate">{link.name}</div>
                    <div className="text-xs text-muted-foreground truncate font-mono">
                      {link.utm_campaign}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{link.campaign_name || "-"}</TableCell>
                <TableCell>{link.platform || "-"}</TableCell>
                <TableCell>
                  {link.lp_type ? (
                    <Badge variant={link.lp_type === 'static' ? 'default' : link.lp_type === 'mauritius' ? 'secondary' : 'outline'}>
                      {link.lp_type}
                    </Badge>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  {link.link_purpose ? (
                    <Badge className={getPurposeColor(link.link_purpose)}>
                      {link.link_purpose}
                    </Badge>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono">
                    {link.utm_medium}
                  </Badge>
                </TableCell>
                <TableCell>{link.month_year || "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {link.entity?.map((e) => (
                      <Badge key={e} variant="outline" className="text-xs">
                        {e}
                      </Badge>
                    )) || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {link.teams?.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        {t}
                      </Badge>
                    )) || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(link.status || "active")}>
                    {link.status || "active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {link.is_validated ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs">Pending</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(link.created_at), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(link.full_url)}
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(link.full_url, "_blank")}
                      title="Open URL"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(link.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete UTM Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this UTM link? This action cannot be undone.
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
};
