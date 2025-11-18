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
import { UtmCampaignDetailDialog } from "@/components/campaigns/UtmCampaignDetailDialog";
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
  const [libraryEntityFilter, setLibraryEntityFilter] = useState<string>("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { data: entities = [] } = useSystemEntities();
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useUtmCampaigns();
  const { createTracking, getEntitiesForCampaign } = useCampaignEntityTracking();
  
  useEffect(() => {
    if (entities.length > 0 && !selectedEntity) {
      setSelectedEntity(entities[0].name);
    }
  }, [entities, selectedEntity]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: any) => {
    console.log('Drag started:', event.active.id);
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const campaignId = String(active.id);
    const dropTargetId = String(over.id);
    
    console.log('Drop attempt:', { campaignId, dropTargetId });
    
    if (!dropTargetId.startsWith('entity-')) {
      console.log('Invalid drop target');
      return;
    }
    const targetEntity = dropTargetId.replace('entity-', '');

    console.log('Creating tracking:', { campaign_id: campaignId, entity: targetEntity });
    await createTracking.mutateAsync({ campaign_id: campaignId, entity: targetEntity, status: "Draft" });
  };

  const transformedCampaigns = campaigns.map((c) => ({
    id: c.id, name: c.name, campaign_type: c.campaign_type, description: c.description,
    landing_page: c.landing_page, is_active: c.is_active, notes: null,
  }));

  const filteredCampaigns = transformedCampaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    // Apply entity filter
    if (libraryEntityFilter === "all") return true;
    
    const campaignEntities = getEntitiesForCampaign(c.id);
    return campaignEntities.some(tracking => tracking.entity === libraryEntityFilter);
  });

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

        <div className={cn(
          "flex-1 overflow-hidden flex flex-col container mx-auto px-4 transition-all duration-300",
          !expandedCampaigns.has('library') && "h-[calc(100vh-200px)]"
        )}>
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
                <button className="w-full flex items-center justify-between py-3 cursor-pointer hover:bg-accent/50 transition-all duration-200 rounded-lg px-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-base">Campaign Library</h3>
                    <Badge variant="secondary" className="ml-1">{filteredCampaigns.length}</Badge>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-300",
                    expandedCampaigns.has('library') && "rotate-180"
                  )} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent 
                className="pb-4 space-y-3 transition-all duration-300"
                style={{ 
                  overflow: expandedCampaigns.has('library') ? 'visible' : 'hidden',
                  maxHeight: expandedCampaigns.has('library') ? '600px' : '0px'
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search campaigns..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="pl-9"
                    />
                  </div>
                  <Select value={libraryEntityFilter} onValueChange={setLibraryEntityFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by Entity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entities</SelectItem>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.name}>
                          {entity.emoji} {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea className="h-40">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pr-4">
                    {filteredCampaigns.map((campaign) => (
                      <DraggableCampaignCard 
                        key={campaign.id} 
                        campaign={campaign} 
                        isDragging={activeDragId === campaign.id}
                        onClick={() => setSelectedCampaignId(campaign.id)}
                      />
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
      
      {selectedCampaignId && (
        <UtmCampaignDetailDialog
          campaignId={selectedCampaignId}
          open={!!selectedCampaignId}
          onOpenChange={(open) => !open && setSelectedCampaignId(null)}
        />
      )}
    </DndContext>
  );
}
