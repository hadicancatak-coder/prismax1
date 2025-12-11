import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Check } from "lucide-react";
import { CopywriterCopy } from "@/hooks/useCopywriterCopies";

interface CopyCardProps {
  copy: CopywriterCopy;
  content: string | null;
  language: "en" | "ar" | "az" | "es";
  onEdit: (copy: CopywriterCopy) => void;
  onDelete: (id: string) => void;
  onSync: (copy: CopywriterCopy) => void;
  isOwner: boolean;
  isAdmin: boolean;
}

export function CopyCard({
  copy,
  content,
  language,
  onEdit,
  onDelete,
  onSync,
  isOwner,
  isAdmin,
}: CopyCardProps) {
  if (!content) return null;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-md space-y-sm">
        <div className={`text-body-sm ${language === "ar" ? "text-right" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
          {content}
        </div>

        <div className="flex flex-wrap gap-xs">
          {copy.platform.map((p) => (
            <Badge key={p} variant="outline" className="text-metadata">
              {p}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-xs">
          {copy.entity.map((e) => (
            <Badge key={e} variant="secondary" className="text-metadata">
              {e}
            </Badge>
          ))}
        </div>

        {copy.campaigns && copy.campaigns.length > 0 && (
          <div className="flex flex-wrap gap-xs">
            {copy.campaigns.map((c) => (
              <Badge key={c} variant="default" className="text-metadata">
                {c}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-sm pt-sm">
          {(isOwner || isAdmin) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(copy)}
              className="h-8"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {(isOwner || isAdmin) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(copy.id)}
              className="h-8"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant={copy.is_synced_to_planner ? "secondary" : "default"}
            size="sm"
            onClick={() => onSync(copy)}
            className="h-8 ml-auto"
            disabled={copy.is_synced_to_planner}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            {copy.is_synced_to_planner ? "Synced" : "Sync"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
