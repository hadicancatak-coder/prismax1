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
            {campaign.name}
          </h3>
        </div>

        {/* Budget */}
        <div className="text-xs text-muted-foreground">
          Budget: ${campaign.budget.toLocaleString()}
        </div>

        {/* Agency */}
        {campaign.agency && (
          <div className="text-xs text-muted-foreground">
            Agency: {campaign.agency}
          </div>
        )}

        {/* Cities */}
        {campaign.cities && campaign.cities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {campaign.cities.slice(0, 2).map((city) => (
              <Badge key={city} variant="secondary" className="text-xs">
                {city}
              </Badge>
            ))}
            {campaign.cities.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{campaign.cities.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Notes */}
        {campaign.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {campaign.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
