import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, FolderOpen, ExternalLink, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EntityCampaignTable } from "@/components/campaigns/EntityCampaignTable";
import { DraggableCampaignCard } from "@/components/campaigns/DraggableCampaignCard";
import { CampaignDetailDialog } from "@/components/campaigns/CampaignDetailDialog";
import { ExternalAccessDialog } from "@/components/campaigns/ExternalAccessDialog";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CampaignsLog() {
  const { data: systemEntities = [] } = useSystemEntities();
  const entities = systemEntities.filter(e => e.is_active).map(e => `${e.emoji} ${e.name}`);
  const { data: utmCampaigns = [], isLoading: campaignsLoading } = useUtmCampaigns();
  const { createTracking, getEntitiesForCampaign } = useCampaignEntityTracking();

  const [campaignsExpanded, setCampaignsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [externalAccessOpen, setExternalAccessOpen] = useState(false);

  const filteredCampaigns = utmCampaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const transformedCampaigns = utmCampaigns.map(c => ({ id: c.id, name: c.name, notes: null }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const campaignId = active.id as string;
    const targetEntity = over.id as string;
    const existingTracking = getEntitiesForCampaign(campaignId);
    
    if (existingTracking.some(t => t.entity === targetEntity)) {
      toast.error("Campaign already exists in this entity");
      return;
    }

    await createTracking.mutateAsync({ campaign_id: campaignId, entity: targetEntity, status: "Draft" });
  };

  if (campaignsLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <DndContext onDragStart={(e) => setActiveDragId(String(e.active.id))} onDragEnd={handleDragEnd} onDragCancel={() => setActiveDragId(null)}>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Campaigns Log</h1>
              <p className="text-muted-foreground">Drag campaigns from library to entity tables</p>
            </div>
            <Button onClick={() => setExternalAccessOpen(true)} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />Generate Review Link
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entities.map(entity => <EntityCampaignTable key={entity} entity={entity} campaigns={transformedCampaigns} />)}
          </div>
        </div>

        <div className="flex-shrink-0 border-t">
          <Collapsible open={campaignsExpanded} onOpenChange={setCampaignsExpanded}>
            <Card className="rounded-none border-0">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" /><CardTitle>Campaign Library</CardTitle><Badge variant="secondary">{utmCampaigns.length}</Badge>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 transition-transform", campaignsExpanded && "rotate-180")} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <Input placeholder="Search campaigns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-4" />
                  <ScrollArea className="h-[280px]">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {filteredCampaigns.map(campaign => (
                        <div key={campaign.id} onClick={() => { setSelectedCampaign(campaign); setDetailDialogOpen(true); }}>
                          <DraggableCampaignCard campaign={campaign} />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>

      <DragOverlay>{activeDragId && <DraggableCampaignCard campaign={utmCampaigns.find(c => c.id === activeDragId)!} />}</DragOverlay>
      {selectedCampaign && <CampaignDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} campaign={selectedCampaign} />}
      <ExternalAccessDialog open={externalAccessOpen} onOpenChange={setExternalAccessOpen} />
    </DndContext>
  );
}
