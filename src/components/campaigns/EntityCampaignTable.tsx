import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { CampaignEntityTracking, useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { UtmCampaignDetailDialog } from "./UtmCampaignDetailDialog";
import { EntityCommentsDialog } from "./EntityCommentsDialog";

interface Campaign {
  id: string;
  name: string;
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
  className?: string;
}

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

  if (!campaign) return null;

  return (
    <>
      <Card 
        className="w-full border-2 min-w-[160px] cursor-pointer hover:border-primary transition-colors"
        onClick={() => setDetailOpen(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm line-clamp-1 flex-1">
              {campaign.name}
            </h4>
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
        </CardContent>
      </Card>

      <UtmCampaignDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        campaignId={tracking.campaign_id}
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
  className,
}: EntityCampaignTableProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { trackingRecords, deleteTracking } = useCampaignEntityTracking();
  const { data: allCampaigns = [] } = useUtmCampaigns();
  const { setNodeRef, isOver } = useDroppable({ id: `entity-${entity}` });

  const entityCampaigns = trackingRecords
    .filter((t) => t.entity === entity)
    .map((t) => ({
      tracking: t,
      campaign: allCampaigns.find((c) => c.id === t.campaign_id) || null,
    }))
    .filter((item) => item.campaign);

  const handleRemove = async (trackingId: string) => {
    try {
      await deleteTracking.mutateAsync(trackingId);
    } catch (error) {
      console.error("Failed to remove campaign:", error);
    }
  };

  return (
    <>
      <EntityCommentsDialog
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        entityName={entity}
        isExternal={isExternal}
        externalReviewerName={externalReviewerName}
        externalReviewerEmail={externalReviewerEmail}
      />

      <Card 
        ref={setNodeRef}
        className={cn(
          "transition-all",
          isOver && "ring-2 ring-primary ring-offset-2",
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg">{entity}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCommentsOpen(true)}
            className="h-8 gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Comments
          </Button>
        </CardHeader>
        <CardContent>
          <div className="min-h-[100px] space-y-2">
            {entityCampaigns.length === 0 ? (
              <div className="flex items-center justify-center h-[100px] border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Drag campaigns here
                </p>
              </div>
            ) : (
              entityCampaigns.map(({ tracking, campaign }) => (
                campaign && (
                  <CampaignTrackingCard
                    key={tracking.id}
                    tracking={tracking}
                    campaign={campaign}
                    entity={entity}
                    onRemove={() => handleRemove(tracking.id)}
                    isExternal={isExternal}
                    externalReviewerName={externalReviewerName}
                    externalReviewerEmail={externalReviewerEmail}
                  />
                )
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
