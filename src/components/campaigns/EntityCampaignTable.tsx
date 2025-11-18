import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CampaignEntityTracking, useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";

interface Campaign {
  id: string;
  name: string;
  notes: string | null;
}

interface EntityCampaignTableProps {
  entity: string;
  campaigns: Campaign[];
}

const STATUS_OPTIONS = [
  { value: "Draft", label: "📝 Draft", color: "bg-gray-500" },
  { value: "Live", label: "🟢 Live", color: "bg-green-500" },
  { value: "Paused", label: "🟡 Paused", color: "bg-yellow-500" },
  { value: "Testing", label: "🔵 Testing", color: "bg-blue-500" },
  { value: "Stopped", label: "🔴 Stopped", color: "bg-red-500" },
];

function CampaignTrackingCard({
  tracking,
  campaign,
  onUpdateStatus,
  onUpdateNotes,
  onRemove,
}: {
  tracking: CampaignEntityTracking;
  campaign: Campaign | undefined;
  onUpdateStatus: (status: string) => void;
  onUpdateNotes: (notes: string) => void;
  onRemove: () => void;
}) {
  const [localNotes, setLocalNotes] = useState(tracking.notes || "");

  if (!campaign) return null;

  const statusOption = STATUS_OPTIONS.find((s) => s.value === tracking.status);

  return (
    <Card className="w-full border-2 min-w-[160px]">
      <CardContent className="p-4 space-y-2.5">
        {/* Header with Title and Remove Button */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm line-clamp-2 flex-1">
            {campaign.title}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
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
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">Landing Page</span>
          </a>
        )}

        {/* Status Dropdown */}
        <div>
          <Select value={tracking.status} onValueChange={onUpdateStatus}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes Textarea */}
        <Textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={() => onUpdateNotes(localNotes)}
          placeholder="Add notes..."
          className="min-h-[60px] text-xs resize-none"
        />
      </CardContent>
    </Card>
  );
}

export function EntityCampaignTable({ entity, campaigns }: EntityCampaignTableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: entity,
  });

  const { getCampaignsByEntity, updateTracking, deleteTracking } = useCampaignEntityTracking();
  const entityCampaigns = getCampaignsByEntity(entity);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">{entity}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {entityCampaigns.length} {entityCampaigns.length === 1 ? "campaign" : "campaigns"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
      <div
        ref={setNodeRef}
        className={cn(
          "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 min-h-[300px] p-6 rounded-lg border-2 border-dashed transition-all duration-200",
          isOver ? "border-primary bg-primary/10 shadow-lg" : "border-border bg-muted/20",
          entityCampaigns.length === 0 && "flex items-center justify-center"
        )}
      >
          {entityCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center col-span-full">
              Drop campaigns here to track them in {entity}
            </p>
          ) : (
            entityCampaigns.map((tracking) => {
              const campaign = campaigns.find((c) => c.id === tracking.campaign_id);
              return (
                <CampaignTrackingCard
                  key={tracking.id}
                  tracking={tracking}
                  campaign={campaign}
                  onUpdateStatus={(status) =>
                    updateTracking.mutate({ id: tracking.id, status })
                  }
                  onUpdateNotes={(notes) =>
                    updateTracking.mutate({ id: tracking.id, notes })
                  }
                  onRemove={() => deleteTracking.mutate(tracking.id)}
                />
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
