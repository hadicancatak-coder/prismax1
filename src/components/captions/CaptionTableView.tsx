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
import { Copy, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Caption } from "@/pages/CaptionLibrary";
import { cn } from "@/lib/utils";
import { getStatusColor } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  // Extract content for a specific language
  const getContentForLanguage = (caption: Caption, lang: "en" | "ar"): string => {
    const content = caption.content;
    
    // If content is a string, it's the default (usually EN)
    if (typeof content === "string") {
      return lang === "en" ? content : "";
    }
    
    // If content is an object, check for language keys
    if (content && typeof content === "object") {
      // Check for direct language keys
      if ((content as any)[lang]) {
        return (content as any)[lang];
      }
      // Check for text property (legacy format)
      if ((content as any).text) {
        return lang === "en" ? (content as any).text : "";
      }
    }
    
    return "";
  };

  const handleCopyContent = (text: string, lang: string) => {
    if (!text) {
      toast.error(`No ${lang.toUpperCase()} content to copy`);
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`${lang.toUpperCase()} content copied`);
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

  // Status color now centralized in constants.ts

  return (
    <TooltipProvider>
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
              <TableHead className="text-metadata font-medium">EN Content</TableHead>
              <TableHead className="text-metadata font-medium">AR Content</TableHead>
              <TableHead className="text-metadata font-medium">Entity</TableHead>
              <TableHead className="text-metadata font-medium">Status</TableHead>
              <TableHead className="text-metadata font-medium">Uses</TableHead>
              <TableHead className="w-24 text-metadata font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {captions.map((caption) => {
              const enContent = getContentForLanguage(caption, "en");
              const arContent = getContentForLanguage(caption, "ar");

              return (
                <TableRow
                  key={caption.id}
                  className="hover:bg-card-hover transition-smooth group"
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
                  
                  {/* EN Content - Click to copy */}
                  <TableCell className="max-w-[200px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleCopyContent(enContent, "en")}
                          className={cn(
                            "text-left text-body-sm truncate w-full px-2 py-1 rounded transition-smooth",
                            enContent 
                              ? "hover:bg-primary/10 cursor-pointer" 
                              : "text-muted-foreground/50 cursor-default"
                          )}
                        >
                          {enContent || "—"}
                        </button>
                      </TooltipTrigger>
                      {enContent && (
                        <TooltipContent side="top" className="max-w-sm">
                          <p className="text-sm">{enContent}</p>
                          <p className="text-xs text-muted-foreground mt-1">Click to copy</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TableCell>
                  
                  {/* AR Content - Click to copy */}
                  <TableCell className="max-w-[200px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleCopyContent(arContent, "ar")}
                          dir="rtl"
                          className={cn(
                            "text-right text-body-sm truncate w-full px-2 py-1 rounded transition-smooth",
                            arContent 
                              ? "hover:bg-primary/10 cursor-pointer" 
                              : "text-muted-foreground/50 cursor-default"
                          )}
                        >
                          {arContent || "—"}
                        </button>
                      </TooltipTrigger>
                      {arContent && (
                        <TooltipContent side="top" className="max-w-sm">
                          <p className="text-sm" dir="rtl">{arContent}</p>
                          <p className="text-xs text-muted-foreground mt-1">Click to copy</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
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
                    <Badge className={`text-metadata ${getStatusColor(caption.google_status)}`}>
                      {caption.google_status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-body-sm text-muted-foreground">
                      {caption.use_count || 0}
                    </span>
                  </TableCell>
                  
                  {/* Actions - Always visible */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(caption)}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10"
                        onClick={() => handleDelete(caption.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}