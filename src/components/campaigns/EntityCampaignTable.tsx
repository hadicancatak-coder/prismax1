import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { CampaignEntityTracking, useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";
import { UtmCampaignDetailDialog } from "./UtmCampaignDetailDialog";
import { CampaignCommentsDialog } from "./CampaignCommentsDialog";

interface Campaign {
  id: string;
  name: string;
  notes: string | null;
}

interface CampaignTrackingCardProps {
  tracking: CampaignEntityTracking;
  campaign: Campaign | undefined;
  onRemove: () => void;
  entity: string;
  isExternal?: boolean;
  externalReviewerName?: string;
  externalReviewerEmail?: string;
}

interface EntityCampaignTableProps {
  entity: string;
  campaigns: Campaign[];
  isExternal?: boolean;
  externalReviewerName?: string;
  externalReviewerEmail?: string;
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
  onRemove,
  entity,
  isExternal = false,
  externalReviewerName,
  externalReviewerEmail,
}: CampaignTrackingCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  if (!campaign) return null;

  const statusOption = STATUS_OPTIONS.find((s) => s.value === tracking.status);

  return (
    <>
      <Card 
        className="w-full border-2 min-w-[160px] cursor-pointer hover:border-primary transition-colors"
        onClick={() => setDetailOpen(true)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm line-clamp-1 flex-1">
              {campaign.name}
            </h4>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setCommentsOpen(true);
                }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
              {!isExternal && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          
          {statusOption && (
            <Badge variant="outline" className="text-xs">
              {statusOption.label}
            </Badge>
          )}
        </CardContent>
      </Card>

      <UtmCampaignDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        campaignId={tracking.campaign_id}
      />

      <CampaignCommentsDialog
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        trackingId={tracking.id}
        campaignName={campaign.name}
        entityName={entity}
        isExternal={isExternal}
        externalReviewerName={externalReviewerName}
        externalReviewerEmail={externalReviewerEmail}
      />
    </>
  );
}

export function EntityCampaignTable({
  entity,
  campaigns,
  isExternal = false,
  externalReviewerName,
  externalReviewerEmail,
}: EntityCampaignTableProps) {
  const { trackingRecords, deleteTracking, getEntityComments } = useCampaignEntityTracking();
  const { setNodeRef, isOver } = useDroppable({ id: `entity-${entity}` });

  const entityCampaigns = trackingRecords.filter((t) => t.entity === entity);
  const entityComments = getEntityComments(entity);

  const handleRemove = async (trackingId: string) => {
    try {
      await deleteTracking.mutateAsync(trackingId);
    } catch (error) {
      console.error('Failed to remove campaign:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {entity}
            <Badge variant="secondary">{entityCampaigns.length}</Badge>
          </CardTitle>
          {entityComments && (
            <p className="text-sm text-muted-foreground mt-1">{entityComments}</p>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div
            ref={setNodeRef}
            className={cn(
              "min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors",
              isOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"
            )}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {entityCampaigns.map((tracking) => {
                const campaign = campaigns.find((c) => c.id === tracking.campaign_id);
                return (
                  <CampaignTrackingCard
                    key={tracking.id}
                    tracking={tracking}
                    campaign={campaign}
                    onRemove={() => handleRemove(tracking.id)}
                    entity={entity}
                    isExternal={isExternal}
                    externalReviewerName={externalReviewerName}
                    externalReviewerEmail={externalReviewerEmail}
                  />
                );
              })}
            </div>
            {entityCampaigns.length === 0 && (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Drop campaigns here
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
