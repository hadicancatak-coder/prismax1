import { useState, useEffect } from "react";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragOverlay } from "@dnd-kit/core";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GripVertical, ExternalLink, Search, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { EntityCampaignTable } from "@/components/campaigns/EntityCampaignTable";
import { DraggableCampaignCard } from "@/components/campaigns/DraggableCampaignCard";
import { ExternalAccessDialog } from "@/components/campaigns/ExternalAccessDialog";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CampaignsLog() {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set(['library']));
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [externalAccessDialogOpen, setExternalAccessDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string>("");

  const { data: entities = [] } = useSystemEntities();
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useUtmCampaigns();
  const { createTracking } = useCampaignEntityTracking();
  
  useEffect(() => {
    if (entities.length > 0 && !selectedEntity) {
      setSelectedEntity(entities[0].name);
    }
  }, [entities, selectedEntity]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: any) => setActiveDragId(String(event.active.id));

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const campaignId = String(active.id);
    const dropTargetId = String(over.id);
    
    if (!dropTargetId.startsWith('entity-')) return;
    const targetEntity = dropTargetId.replace('entity-', '');

    try {
      await createTracking.mutateAsync({ campaign_id: campaignId, entity: targetEntity, status: "Draft" });
      toast.success(`Campaign added to ${targetEntity}`);
    } catch (error: any) {
      toast.error(error.message?.includes("duplicate") ? "Campaign already exists in this entity" : "Failed to add campaign");
    }
  };

  const transformedCampaigns = campaigns.map((c) => ({
    id: c.id, name: c.name, campaign_type: c.campaign_type, description: c.description,
    landing_page: c.landing_page, is_active: c.is_active, notes: null,
  }));

  const filteredCampaigns = transformedCampaigns.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoadingCampaigns) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background flex flex-col">
        <div className="container mx-auto py-6 px-4 space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Campaign Log</h1>
                <p className="text-muted-foreground mt-1">Track campaign status by entity</p>
              </div>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.name} value={entity.name}>
                      {entity.emoji} {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setExternalAccessDialogOpen(true)}>
              <ExternalLink className="h-4 w-4 mr-2" />Generate Review Link
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col container mx-auto px-4">
          {selectedEntity && (
            <div className="flex-1 overflow-hidden">
              <EntityCampaignTable entity={selectedEntity} campaigns={transformedCampaigns} />
            </div>
          )}
        </div>
        
        <div className="border-t bg-card flex-shrink-0">
          <div className="container mx-auto px-4">
            <Collapsible open={expandedCampaigns.has('library')} onOpenChange={(open) => {
              const newExpanded = new Set(expandedCampaigns);
              open ? newExpanded.add('library') : newExpanded.delete('library');
              setExpandedCampaigns(newExpanded);
            }}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Campaign Library</h3>
                    <Badge variant="secondary">{filteredCampaigns.length}</Badge>
                  </div>
                  <ChevronDown className={cn("h-5 w-5 transition-transform", expandedCampaigns.has('library') && "rotate-180")} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search campaigns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1" />
                </div>
                <ScrollArea className="h-40">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pr-4">
                    {filteredCampaigns.map((campaign) => (
                      <DraggableCampaignCard key={campaign.id} campaign={campaign} isDragging={activeDragId === campaign.id} />
                    ))}
                  </div>
                  {filteredCampaigns.length === 0 && <div className="text-center text-muted-foreground py-8">No campaigns found</div>}
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
      
      <DragOverlay>
        {activeDragId ? <DraggableCampaignCard campaign={transformedCampaigns.find(c => c.id === activeDragId)!} isDragging={true} /> : null}
      </DragOverlay>

      <ExternalAccessDialog open={externalAccessDialogOpen} onOpenChange={setExternalAccessDialogOpen} />
    </DndContext>
  );
}
