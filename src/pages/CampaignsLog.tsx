import { useState, useEffect } from "react";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragOverlay, useDroppable } from "@dnd-kit/core";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GripVertical, ExternalLink, Search, ChevronDown, Plus, Trash2, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EntityCampaignTable } from "@/components/campaigns/EntityCampaignTable";
import { DraggableCampaignCard } from "@/components/campaigns/DraggableCampaignCard";
import { ExternalAccessDialog } from "@/components/campaigns/ExternalAccessDialog";
import { UtmCampaignDetailDialog } from "@/components/campaigns/UtmCampaignDetailDialog";
import { CreateUtmCampaignDialog } from "@/components/campaigns/CreateUtmCampaignDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function TrashZone({ isActive }: { isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "trash-zone" });
  if (!isActive) return null;
  return (
    <div ref={setNodeRef} className={cn("fixed bottom-0 left-0 right-0 z-50 h-24 flex items-center justify-center transition-all duration-300", isOver ? "bg-destructive" : "bg-destructive/70")}>
      <div className="flex items-center gap-3 text-destructive-foreground">
        <Trash2 className="h-8 w-8" />
        <span className="text-xl font-semibold">{isOver ? "Release to remove" : "Drag here to remove from entity"}</span>
      </div>
    </div>
  );
}

export default function CampaignsLog() {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set(['library']));
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [externalAccessDialogOpen, setExternalAccessDialogOpen] = useState(false);
  const [createCampaignDialogOpen, setCreateCampaignDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [libraryEntityFilter, setLibraryEntityFilter] = useState<string>("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [bulkTargetEntity, setBulkTargetEntity] = useState<string>("");

  const { data: entities = [] } = useSystemEntities();
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useUtmCampaigns();
  const { createTracking, getEntitiesForCampaign, deleteTracking } = useCampaignEntityTracking();
  
  useEffect(() => {
    if (entities.length > 0 && !selectedEntity) setSelectedEntity(entities[0].name);
  }, [entities, selectedEntity]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: any) => setActiveDragId(String(event.active.id));

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const campaignId = String(active.id);
    const dropTargetId = String(over.id);
    
    if (dropTargetId === "trash-zone") {
      const entitiesToRemove = getEntitiesForCampaign(campaignId);
      try {
        await Promise.all(entitiesToRemove.map(t => deleteTracking.mutateAsync(t.id)));
        toast.success("Campaign removed from all entities");
      } catch {
        toast.error("Failed to remove campaign");
      }
      return;
    }
    
    if (!dropTargetId.startsWith('entity-')) return;
    const targetEntity = dropTargetId.replace('entity-', '');

    try {
      await createTracking.mutateAsync({ campaign_id: campaignId, entity: targetEntity, status: "Draft" });
      toast.success(`Campaign added to ${targetEntity}`);
    } catch (error: any) {
      toast.error(error.message?.includes("duplicate") ? "Campaign already exists in this entity" : "Failed to add campaign");
    }
  };

  const transformedCampaigns = campaigns.map((c) => ({ id: c.id, name: c.name, campaign_type: c.campaign_type, description: c.description, landing_page: c.landing_page, is_active: c.is_active, notes: null }));

  const filteredCampaigns = transformedCampaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (libraryEntityFilter === "all") return true;
    return getEntitiesForCampaign(c.id).some(t => t.entity === libraryEntityFilter);
  });

  const handleBulkAssign = async () => {
    if (!bulkTargetEntity || selectedCampaigns.length === 0) return;
    try {
      await Promise.all(selectedCampaigns.map(id => createTracking.mutateAsync({ campaign_id: id, entity: bulkTargetEntity, status: "Draft" })));
      toast.success(`${selectedCampaigns.length} campaigns added to ${bulkTargetEntity}`);
      setSelectedCampaigns([]);
      setBulkAssignDialogOpen(false);
      setBulkTargetEntity("");
    } catch {
      toast.error("Failed to assign campaigns");
    }
  };

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
                <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select entity" /></SelectTrigger>
                <SelectContent>{entities.map((e) => <SelectItem key={e.name} value={e.name}>{e.emoji} {e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={() => setExternalAccessDialogOpen(true)}><ExternalLink className="h-4 w-4 mr-2" />Generate Review Link</Button>
          </div>
        </div>

        <div className={cn("flex-1 overflow-hidden flex flex-col container mx-auto px-4 transition-all duration-300", !expandedCampaigns.has('library') && "h-[calc(100vh-200px)]")}>
          {selectedEntity && <div className="flex-1 overflow-hidden"><EntityCampaignTable entity={selectedEntity} campaigns={transformedCampaigns} /></div>}
        </div>
        
        <div className="border-t bg-card flex-shrink-0">
          <div className="container mx-auto px-4">
            <Collapsible open={expandedCampaigns.has('library')} onOpenChange={(open) => { const n = new Set(expandedCampaigns); open ? n.add('library') : n.delete('library'); setExpandedCampaigns(n); }}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between py-3 cursor-pointer hover:bg-accent/50 transition-all duration-200 rounded-lg px-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-base">Campaign Library</h3>
                    <Badge variant="secondary" className="ml-1">{filteredCampaigns.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCampaigns.length > 0 && <Button onClick={(e) => { e.stopPropagation(); setBulkAssignDialogOpen(true); }} size="sm" variant="secondary"><Check className="h-4 w-4 mr-2" />Assign {selectedCampaigns.length} Campaigns</Button>}
                    <Button onClick={(e) => { e.stopPropagation(); setCreateCampaignDialogOpen(true); }} size="sm" variant="default"><Plus className="h-4 w-4 mr-2" />Add Campaign</Button>
                    <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", expandedCampaigns.has('library') && "rotate-180")} />
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-4 space-y-3 transition-all duration-300" style={{ overflow: expandedCampaigns.has('library') ? 'visible' : 'hidden', maxHeight: expandedCampaigns.has('library') ? '600px' : '0px' }}>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input placeholder="Search campaigns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={libraryEntityFilter} onValueChange={setLibraryEntityFilter}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by entity" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Entities</SelectItem>{entities.map((e) => <SelectItem key={e.name} value={e.name}>{e.emoji} {e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <ScrollArea className="h-[500px] pr-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {filteredCampaigns.map((c) => <div key={c.id} className="relative"><Checkbox checked={selectedCampaigns.includes(c.id)} onCheckedChange={() => setSelectedCampaigns(p => p.includes(c.id) ? p.filter(i => i !== c.id) : [...p, c.id])} className="absolute top-2 left-2 z-10" /><DraggableCampaignCard campaign={c} isDragging={activeDragId === c.id} onClick={() => setSelectedCampaignId(c.id)} /></div>)}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
        <TrashZone isActive={activeDragId !== null} />
      </div>
      <DragOverlay>{activeDragId && <DraggableCampaignCard campaign={transformedCampaigns.find((c) => c.id === activeDragId)!} isDragging />}</DragOverlay>
      <ExternalAccessDialog open={externalAccessDialogOpen} onOpenChange={setExternalAccessDialogOpen} />
      <CreateUtmCampaignDialog open={createCampaignDialogOpen} onOpenChange={setCreateCampaignDialogOpen} />
      {selectedCampaignId && <UtmCampaignDetailDialog open={!!selectedCampaignId} onOpenChange={(o) => !o && setSelectedCampaignId(null)} campaignId={selectedCampaignId} />}
      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Campaigns to Entity</DialogTitle><DialogDescription>Select an entity to assign {selectedCampaigns.length} campaign(s)</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={bulkTargetEntity} onValueChange={setBulkTargetEntity}>
              <SelectTrigger><SelectValue placeholder="Select entity" /></SelectTrigger>
              <SelectContent>{entities.map((e) => <SelectItem key={e.name} value={e.name}>{e.emoji} {e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBulkAssignDialogOpen(false)}>Cancel</Button><Button onClick={handleBulkAssign} disabled={!bulkTargetEntity}>Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
