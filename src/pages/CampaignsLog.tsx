import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { CampaignLogCard } from "@/components/campaigns/CampaignLogCard";
import { toast } from "sonner";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  entity: string[];
  lp_link: string | null;
  image_url: string | null;
  notes: string | null;
}

export default function CampaignsLog() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleUpdateNotes = async (campaignId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ notes })
        .eq("id", campaignId);

      if (error) throw error;

      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, notes } : c))
      );

      toast.success("Notes updated successfully");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    }
  };

  // Group campaigns by entity
  const campaignsByEntity = campaigns.reduce((acc, campaign) => {
    const entities = campaign.entity || ["Unassigned"];
    entities.forEach((entity) => {
      if (!acc[entity]) {
        acc[entity] = [];
      }
      acc[entity].push(campaign);
    });
    return acc;
  }, {} as Record<string, Campaign[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Campaigns Log</h1>
        <p className="text-muted-foreground">
          View and manage campaign details, landing pages, and notes
        </p>
      </div>

      {Object.keys(campaignsByEntity).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No campaigns found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(campaignsByEntity).map(([entity, entityCampaigns]) => (
            <div key={entity} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground">
                  {entity}
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({entityCampaigns.length} {entityCampaigns.length === 1 ? "campaign" : "campaigns"})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entityCampaigns.map((campaign) => (
                  <CampaignLogCard
                    key={campaign.id}
                    campaign={campaign}
                    onUpdateNotes={handleUpdateNotes}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
