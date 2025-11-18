import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  description: string;
  landing_page: string;
  is_active: boolean;
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
            {campaign.name}
          </h3>
        </div>

        {/* Campaign Type */}
        <Badge variant="outline" className="text-xs w-fit">
          {campaign.campaign_type}
        </Badge>

        {/* Description */}
        {campaign.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}

        {/* Landing Page */}
        {campaign.landing_page && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{new URL(campaign.landing_page).hostname}</span>
          </div>
        )}

        {/* Status */}
        {!campaign.is_active && (
          <Badge variant="secondary" className="text-xs w-fit">
            Inactive
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
