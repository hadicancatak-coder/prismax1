import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  budget: number;
  agency: string | null;
  cities: string[];
  notes: string | null;
}

interface DraggableCampaignCardProps {
  campaign: Campaign;
  isDragging?: boolean;
}

export function DraggableCampaignCard({ campaign, isDragging }: DraggableCampaignCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: campaign.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full transition-all cursor-grab active:cursor-grabbing hover:shadow-lg border-2",
        isDragging && "opacity-50 shadow-xl scale-105"
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h3 className="font-semibold text-sm line-clamp-2 flex-1">
            {campaign.title}
          </h3>
        </div>

        {/* Image Preview */}
        {campaign.image_url && (
          <div className="w-full h-24 rounded overflow-hidden bg-muted">
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* LP Link */}
        {campaign.lp_link && (
          <a
            href={campaign.lp_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">Landing Page</span>
          </a>
        )}

        {/* Entity Tags */}
        {campaign.entity && campaign.entity.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {campaign.entity.slice(0, 2).map((entity) => (
              <Badge key={entity} variant="secondary" className="text-xs">
                {entity}
              </Badge>
            ))}
            {campaign.entity.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{campaign.entity.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Description */}
        {campaign.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
