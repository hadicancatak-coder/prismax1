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
      <div
        className="relative group cursor-pointer transition-all duration-200 hover:scale-105"
        onClick={() => setDetailOpen(true)}
      >
        <Card className="border-2 border-border bg-card hover:border-primary">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium line-clamp-2 flex-1">
                {campaign.name}
              </p>
              {!isExternal && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
      </div>

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
          "transition-all bg-slate-800 dark:bg-slate-900",
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
          <div className="min-h-[300px] p-6">
            {entityCampaigns.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Drag campaigns here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {entityCampaigns.map(({ tracking, campaign }) => (
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
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
