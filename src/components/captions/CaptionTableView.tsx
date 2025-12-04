import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Edit, Star, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Caption } from "@/pages/CaptionLibrary";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CaptionTableViewProps {
  captions: Caption[];
  onEdit: (caption: Caption) => void;
}

export function CaptionTableView({ captions, onEdit }: CaptionTableViewProps) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === captions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(captions.map((c) => c.id)));
    }
  };

  const handleCopy = (caption: Caption) => {
    const text = typeof caption.content === "string"
      ? caption.content
      : caption.content?.text || "";
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ad_elements").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete caption");
      return;
    }
    toast.success("Caption deleted");
    queryClient.invalidateQueries({ queryKey: ["captions"] });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const { error } = await supabase
      .from("ad_elements")
      .delete()
      .in("id", Array.from(selectedIds));
    
    if (error) {
      toast.error("Failed to delete captions");
      return;
    }
    
    toast.success(`Deleted ${selectedIds.size} captions`);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ["captions"] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/15 text-success border-success/30";
      case "rejected":
        return "bg-destructive/15 text-destructive border-destructive/30";
      default:
        return "bg-warning/15 text-warning border-warning/30";
    }
  };

  return (
    <div className="relative">
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 bg-muted border-b border-border">
          <span className="text-body-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="bg-elevated hover:bg-elevated">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.size === captions.length && captions.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead className="text-metadata font-medium">Type</TableHead>
            <TableHead className="text-metadata font-medium">Content</TableHead>
            <TableHead className="text-metadata font-medium">Entity</TableHead>
            <TableHead className="text-metadata font-medium">Language</TableHead>
            <TableHead className="text-metadata font-medium">Status</TableHead>
            <TableHead className="text-metadata font-medium">Uses</TableHead>
            <TableHead className="text-metadata font-medium">Created</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {captions.map((caption) => {
            const contentText = typeof caption.content === "string"
              ? caption.content
              : caption.content?.text || "";

            return (
              <TableRow
                key={caption.id}
                className="hover:bg-card-hover transition-smooth"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(caption.id)}
                    onCheckedChange={() => toggleSelect(caption.id)}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-metadata capitalize">
                    {caption.element_type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="text-body-sm truncate">{contentText}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {caption.entity?.slice(0, 2).map((e) => (
                      <Badge key={e} variant="secondary" className="text-metadata">
                        {e}
                      </Badge>
                    ))}
                    {caption.entity?.length > 2 && (
                      <Badge variant="secondary" className="text-metadata">
                        +{caption.entity.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-body-sm">{caption.language || "EN"}</span>
                </TableCell>
                <TableCell>
                  <Badge className={`text-metadata ${getStatusColor(caption.google_status)}`}>
                    {caption.google_status || "pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-body-sm text-muted-foreground">
                    {caption.use_count || 0}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-metadata text-muted-foreground">
                    {format(new Date(caption.created_at), "MMM d, yyyy")}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopy(caption)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(caption)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(caption.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
