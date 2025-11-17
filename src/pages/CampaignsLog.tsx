import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DraggableCampaignCard } from "@/components/campaigns/DraggableCampaignCard";
import { EntityCampaignTable } from "@/components/campaigns/EntityCampaignTable";
import { useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  entity: string[] | null;
  lp_link: string | null;
  image_url: string | null;
  notes: string | null;
}

export default function CampaignsLog() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<string>("all");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const { createTracking, getEntitiesForCampaign } = useCampaignEntityTracking();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  // Get all unique entities from campaigns
  const allEntities = Array.from(
    new Set(
      campaigns.flatMap((c) => c.entity || [])
    )
  ).sort();

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const campaignId = active.id as string;
    const targetEntity = over.id as string;

    // Check if campaign is already in this entity
    const existingTracking = getEntitiesForCampaign(campaignId);
    const alreadyExists = existingTracking.some((t) => t.entity === targetEntity);

    if (alreadyExists) {
      toast.error("Campaign already exists in this entity");
      return;
    }

    // Create tracking record
    await createTracking.mutateAsync({
      campaign_id: campaignId,
      entity: targetEntity,
      status: "Draft",
    });
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  // Get campaigns not yet tracked in selected entity
  const availableCampaigns = campaigns.filter((campaign) => {
    if (selectedEntity === "all") return true;
    const tracking = getEntitiesForCampaign(campaign.id);
    return !tracking.some((t) => t.entity === selectedEntity);
  });

  const activeCampaign = campaigns.find((c) => c.id === activeDragId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="container mx-auto py-8 px-4 max-w-[1800px]">
        {/* Header with Entity Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Campaigns Log</h1>
              <p className="text-muted-foreground">
                Drag campaigns to entity tables to track their status
              </p>
            </div>
          </div>

          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {allEntities.map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Available Campaigns Pool */}
        {availableCampaigns.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Available Campaigns
                <span className="text-sm text-muted-foreground ml-2">
                  (Drag to entity table below)
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {availableCampaigns.map((campaign) => (
                  <DraggableCampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    isDragging={activeDragId === campaign.id}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entity Tables */}
        <div className="space-y-6">
          {selectedEntity === "all" ? (
            allEntities.map((entity) => (
              <EntityCampaignTable
                key={entity}
                entity={entity}
                campaigns={campaigns}
              />
            ))
          ) : (
            <EntityCampaignTable
              entity={selectedEntity}
              campaigns={campaigns}
            />
          )}
        </div>

        {/* No Entities */}
        {allEntities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No entities found. Add campaigns with entity tags first.
            </p>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeCampaign && <DraggableCampaignCard campaign={activeCampaign} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
