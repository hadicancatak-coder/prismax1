import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Edit, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Caption } from "@/pages/CaptionLibrary";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStatusColor } from "@/lib/constants";

interface CaptionGridViewProps {
  captions: Caption[];
  onEdit: (caption: Caption) => void;
}

export function CaptionGridView({ captions, onEdit }: CaptionGridViewProps) {
  const queryClient = useQueryClient();

  const getContentForLanguage = (content: unknown, lang: "en" | "ar"): string => {
    if (!content) return "";
    if (typeof content === "string") return lang === "en" ? content : "";
    if (typeof content === "object" && content !== null) {
      const obj = content as Record<string, unknown>;
      if (obj[lang] && typeof obj[lang] === "string") return obj[lang] as string;
      if (obj.text && typeof obj.text === "string") return lang === "en" ? obj.text as string : "";
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

  // Status color now centralized in constants.ts

  const getTypeColor = (type: string) => {
    switch (type) {
      case "headline":
        return "bg-primary/10 text-primary";
      case "description":
        return "status-info";
      case "primary_text":
        return "status-purple";
      case "sitelink":
        return "status-orange";
      case "callout":
        return "status-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <TooltipProvider>
      <div className="grid gap-md p-md md:grid-cols-2 lg:grid-cols-3">
        {captions.map((caption) => {
          const enContent = getContentForLanguage(caption.content, "en");
          const arContent = getContentForLanguage(caption.content, "ar");

          return (
            <Card 
              key={caption.id} 
              className="bg-card border-border hover:border-primary/30 transition-smooth group"
            >
              <CardContent className="p-md space-y-sm">
                <div className="flex items-start justify-between gap-sm">
                  <Badge className={getTypeColor(caption.element_type)}>
                    {caption.element_type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleToggleFavorite(caption)}
                    >
                      <Star 
                        className={`h-4 w-4 ${caption.is_favorite ? "fill-amber text-amber" : ""}`} 
                      />
                    </Button>
                  </div>
                </div>

                {/* EN Content - Click to copy */}
                <div className="space-y-1">
                  <span className="text-metadata text-muted-foreground">EN</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleCopyContent(enContent, "en")}
                        className="w-full text-left p-sm rounded-md bg-muted/50 hover:bg-muted transition-smooth cursor-pointer"
                      >
                        <p className="text-body-sm line-clamp-2">
                          {enContent || <span className="text-muted-foreground italic">No EN content</span>}
                        </p>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy EN</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* AR Content - Click to copy */}
                <div className="space-y-1">
                  <span className="text-metadata text-muted-foreground">AR</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleCopyContent(arContent, "ar")}
                        className="w-full text-right p-sm rounded-md bg-muted/50 hover:bg-muted transition-smooth cursor-pointer"
                        dir="rtl"
                      >
                        <p className="text-body-sm line-clamp-2">
                          {arContent || <span className="text-muted-foreground italic">No AR content</span>}
                        </p>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy AR</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

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
    </TooltipProvider>
  );
}
