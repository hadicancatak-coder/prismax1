import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, MessageSquare, History, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CampaignEntityTracking, useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";
import { useCampaignMetadata } from "@/hooks/useCampaignMetadata";
import { useCampaignComments } from "@/hooks/useCampaignComments";
import { useCampaignVersions } from "@/hooks/useCampaignVersions";
import { CampaignCommentsDialog } from "./CampaignCommentsDialog";
import { UtmCampaignDetailDialog } from "./UtmCampaignDetailDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Campaign {
  id: string;
  name: string;
  notes: string | null;
}

interface CampaignTrackingCardProps {
  tracking: CampaignEntityTracking;
  campaign: Campaign | undefined;
  onUpdateStatus: (status: string) => void;
  onUpdateNotes: (notes: string) => void;
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
  onUpdateStatus,
  onUpdateNotes,
  onRemove,
  entity,
  isExternal = false,
  externalReviewerName,
  externalReviewerEmail,
}: CampaignTrackingCardProps) {
  const [localNotes, setLocalNotes] = useState(tracking.notes || "");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const { useMetadata } = useCampaignMetadata();
  const { data: metadata } = useMetadata(tracking.campaign_id);
  const { useComments } = useCampaignComments();
  const { data: comments = [] } = useComments(tracking.id);
  const { useVersions } = useCampaignVersions();
  const { data: versions = [] } = useVersions(tracking.campaign_id);

  if (!campaign) return null;

  const statusOption = STATUS_OPTIONS.find((s) => s.value === tracking.status);

  return (
    <div className="space-y-2">
      <Card className="w-full border-2 min-w-[160px]">
        <CardContent className="p-4 space-y-2.5">
          {/* Header with Title, Version, and Remove Button */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1">
              <h4 
                className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => setDetailOpen(true)}
              >
                {campaign.name}
              </h4>
              {metadata?.version_code && (
                <Badge variant="outline" className="text-xs">
                  {metadata.version_code}
                </Badge>
              )}
            </div>
            {!isExternal && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Status Dropdown */}
          <div>
            <Select 
              value={tracking.status} 
              onValueChange={onUpdateStatus}
              disabled={isExternal}
            >
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
            disabled={isExternal}
          />

          {/* Collapsible Comments Section */}
          <Collapsible open={commentsExpanded} onOpenChange={setCommentsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between gap-2 h-8 text-xs"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", commentsExpanded && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommentsOpen(true)}
                className="w-full text-xs"
              >
                View All Comments
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {/* Version History Toggle */}
          {versions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVersions(!showVersions)}
              className="w-full justify-between gap-2 h-8 text-xs"
            >
              <span className="flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                {versions.length} {versions.length === 1 ? "Version" : "Versions"}
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showVersions && "rotate-180")} />
            </Button>
          )}
        </CardContent>

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
        
        <UtmCampaignDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          campaignId={tracking.campaign_id}
        />
      </Card>

      {/* Version History as Child Rows */}
      {showVersions && versions.length > 0 && (
        <div className="ml-4 space-y-1">
          {versions.slice(0, 3).map((version) => (
            <Card key={version.id} className="border border-muted bg-muted/30">
              <CardContent className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">v{version.version_number}</Badge>
                  <span className="text-xs text-muted-foreground line-clamp-1">{version.name}</span>
                </div>
                {version.version_notes && (
                  <span className="text-xs text-muted-foreground line-clamp-1 max-w-[120px]">
                    {version.version_notes}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
          {versions.length > 3 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setDetailOpen(true)}
              className="text-xs h-auto p-1"
            >
              View all {versions.length} versions
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function EntityCampaignTable({ 
  entity, 
  campaigns, 
  isExternal = false,
  externalReviewerName,
  externalReviewerEmail,
}: EntityCampaignTableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `entity-${entity}`,
    disabled: isExternal,
  });

  const { 
    getCampaignsByEntity, 
    updateTracking, 
    deleteTracking,
    updateEntityComments,
    getEntityComments,
  } = useCampaignEntityTracking();
  const entityCampaigns = getCampaignsByEntity(entity);
  const [localEntityComments, setLocalEntityComments] = useState(
    getEntityComments(entity) || ""
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">{entity}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {entityCampaigns.length} {entityCampaigns.length === 1 ? "campaign" : "campaigns"}
          </Badge>
        </div>
        
        {/* Entity-level comments */}
        <Textarea
          placeholder="Notes for this entity..."
          value={localEntityComments}
          onChange={(e) => setLocalEntityComments(e.target.value)}
          onBlur={() => updateEntityComments.mutate({ entity, comments: localEntityComments })}
          className="min-h-[80px] text-sm"
          disabled={isExternal}
        />
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
                entity={entity}
                isExternal={isExternal}
                externalReviewerName={externalReviewerName}
                externalReviewerEmail={externalReviewerEmail}
              />
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
