import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Edit, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Caption } from "@/pages/CaptionLibrary";

interface CaptionGridViewProps {
  captions: Caption[];
  onEdit: (caption: Caption) => void;
}

export function CaptionGridView({ captions, onEdit }: CaptionGridViewProps) {
  const queryClient = useQueryClient();

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

  const handleToggleFavorite = async (caption: Caption) => {
    const { error } = await supabase
      .from("ad_elements")
      .update({ is_favorite: !caption.is_favorite })
      .eq("id", caption.id);
    
    if (error) {
      toast.error("Failed to update");
      return;
    }
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "headline":
        return "bg-primary/10 text-primary";
      case "description":
        return "bg-blue-500/10 text-blue-500";
      case "primary_text":
        return "bg-purple-500/10 text-purple-500";
      case "sitelink":
        return "bg-orange-500/10 text-orange-500";
      case "callout":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {captions.map((caption) => {
        const contentText = typeof caption.content === "string"
          ? caption.content
          : caption.content?.text || "";

        return (
          <Card 
            key={caption.id} 
            className="bg-card border-border hover:border-primary/30 transition-smooth group"
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge className={getTypeColor(caption.element_type)}>
                  {caption.element_type}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-smooth"
                    onClick={() => handleToggleFavorite(caption)}
                  >
                    <Star 
                      className={`h-4 w-4 ${caption.is_favorite ? "fill-yellow-400 text-yellow-400" : ""}`} 
                    />
                  </Button>
                </div>
              </div>

              <p className="text-body font-medium line-clamp-3">{contentText}</p>

              <div className="flex flex-wrap gap-1.5">
                {caption.entity?.map((e) => (
                  <Badge key={e} variant="outline" className="text-metadata">
                    {e}
                  </Badge>
                ))}
                {caption.language && (
                  <Badge variant="secondary" className="text-metadata">
                    {caption.language}
                  </Badge>
                )}
                <Badge className={`text-metadata ${getStatusColor(caption.google_status)}`}>
                  {caption.google_status || "pending"}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-metadata text-muted-foreground">
                  {caption.use_count || 0} uses
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(caption)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(caption)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(caption.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
