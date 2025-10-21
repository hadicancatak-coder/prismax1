import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Edit, Trash2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { UtmLink, useDeleteUtmLink } from "@/hooks/useUtmLinks";
import { formatDistanceToNow } from "date-fns";
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

interface UtmTableProps {
  links: UtmLink[];
  onEdit?: (link: UtmLink) => void;
}

export const UtmTable = ({ links, onEdit }: UtmTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteUtmLink = useDeleteUtmLink();

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteUtmLink.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "paused":
        return "bg-yellow-500/10 text-yellow-500";
      case "archived":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Medium</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Validated</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No UTM links found. Create your first one above!
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{link.utm_source}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{link.utm_medium}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{link.utm_campaign}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(link.status)}>
                      {link.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {link.is_validated ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(link.full_url)}
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(link.full_url, "_blank")}
                        title="Open URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(link)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(link.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
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
