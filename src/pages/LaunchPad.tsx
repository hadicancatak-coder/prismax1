import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Rocket, Satellite, PauseCircle } from "lucide-react";
import { LaunchCampaignDialog } from "@/components/LaunchCampaignDialog";
import { LaunchCampaignCard } from "@/components/LaunchCampaignCard";

export default function LaunchPad() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
    
    const channel = supabase
      .channel('launch-campaigns-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'launch_pad_campaigns' }, () => {
        fetchCampaigns();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('launch_pad_campaigns')
        .select(`
          *,
          launch_campaign_assignees(
            user_id,
            profiles:user_id(name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast({ title: "Error fetching campaigns", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('launch_pad_campaigns')
        .update({ status: 'live', launched_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "🚀 Campaign Launched!", description: "Mission is now in orbit" });
    } catch (error: any) {
      toast({ title: "Launch failed", description: error.message, variant: "destructive" });
    }
  };

  const socialUACampaigns = campaigns.filter(c => c.teams?.includes('Social UA'));
  const ppcCampaigns = campaigns.filter(c => c.teams?.includes('PPC'));
  const pendingCampaigns = campaigns.filter(c => c.status === 'pending');
  const inOrbitCampaigns = campaigns.filter(c => c.status === 'live');

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="h-8 w-8 text-primary" />
            Launch Pad
          </h1>
          <p className="text-muted-foreground mt-1">Mission control for campaign launches</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Social UA Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">🧩 Social UA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {socialUACampaigns.map(campaign => (
              <LaunchCampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onLaunch={handleLaunch}
              />
            ))}
            {socialUACampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No campaigns yet</p>
            )}
          </CardContent>
        </Card>

        {/* PPC Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">🎯 PPC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ppcCampaigns.map(campaign => (
              <LaunchCampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onLaunch={handleLaunch}
              />
            ))}
            {ppcCampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No campaigns yet</p>
            )}
          </CardContent>
        </Card>

        {/* Pending for Launch Column */}
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              🚧 Pending for Launch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingCampaigns.map(campaign => (
              <LaunchCampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onLaunch={handleLaunch}
                showLaunchButton
              />
            ))}
            {pendingCampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">🚀 Ready for Liftoff</p>
            )}
          </CardContent>
        </Card>

        {/* In Orbit Column */}
        <Card className="border-success/50 bg-success/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Satellite className="h-4 w-4" />
              🛰️ In Orbit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inOrbitCampaigns.map(campaign => (
              <LaunchCampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onLaunch={handleLaunch}
              />
            ))}
            {inOrbitCampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No active missions</p>
            )}
          </CardContent>
        </Card>
      </div>

      <LaunchCampaignDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={fetchCampaigns}
      />
    </div>
  );
}
