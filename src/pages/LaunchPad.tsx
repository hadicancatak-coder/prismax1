import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Rocket, Building, Radio, Users } from "lucide-react";
import { LaunchCampaignDialog } from "@/components/LaunchCampaignDialog";
import { LaunchCampaignDetailDialog } from "@/components/LaunchCampaignDetailDialog";
import { LaunchCampaignCard } from "@/components/LaunchCampaignCard";

export default function LaunchPad() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
            profiles!launch_campaign_assignees_user_id_fkey(name, avatar_url)
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
      const campaign = campaigns.find(c => c.id === id);
      if (!campaign) return;

      // Notify all assignees about the launch
      if (campaign.launch_campaign_assignees?.length > 0) {
        const notifications = campaign.launch_campaign_assignees.map((assignee: any) => ({
          user_id: assignee.user_id,
          type: 'task_assigned',
          payload_json: {
            campaign_id: campaign.id,
            campaign_title: campaign.title,
            assigned_by: user?.id,
            message: `Campaign "${campaign.title}" is now live! Check your agenda for details.`
          }
        }));
        
        await supabase.from('notifications').insert(notifications);
      }

      // Update campaign to live (moved to team box)
      const { error } = await supabase
        .from('launch_pad_campaigns')
        .update({ 
          status: 'live',
          launched_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({ 
        title: "🚀 Campaign launched successfully", 
        description: `${campaign.launch_campaign_assignees?.length || 0} team member(s) notified. Campaign is now live.`
      });
    } catch (error: any) {
      toast({ title: "Launch failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const campaign = campaigns.find(c => c.id === id);
      const confirmed = confirm(
        `Delete "${campaign?.title}"?\n\n` +
        `This will permanently remove the campaign and cannot be undone.`
      );
      if (!confirmed) return;

      // Delete assignees first (foreign key constraint)
      await supabase
        .from('launch_campaign_assignees')
        .delete()
        .eq('campaign_id', id);

      // Delete campaign
      const { error } = await supabase
        .from('launch_pad_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ 
        title: "Campaign deleted", 
        description: "Campaign has been removed from Launch Pad" 
      });
      
      fetchCampaigns();
    } catch (error: any) {
      toast({ 
        title: "Delete failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const pendingCampaigns = campaigns.filter(c => c.status === 'pending');
  const socialUACampaigns = campaigns.filter(c => c.status === 'live' && c.teams?.includes('SocialUA'));
  const ppcCampaigns = campaigns.filter(c => c.status === 'live' && c.teams?.includes('PPC'));
  const orbitCampaigns = campaigns.filter(c => c.status === 'orbit');
  const landedCampaigns = campaigns.filter(c => c.status === 'landed');

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1800px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="h-8 w-8 text-primary" />
            Campaign Launch Pad
          </h1>
          <p className="text-muted-foreground mt-1">Professional campaign management and tracking</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Professional Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-primary/50">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{campaigns.length}</p>
              <Rocket className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500/50">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Pending Launch</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{pendingCampaigns.length}</p>
              <Building className="h-8 w-8 text-amber-500/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500/50">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">In Orbit</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{orbitCampaigns.length}</p>
              <Radio className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500/50">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Team Members</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">
                {new Set(campaigns.flatMap(c => c.launch_campaign_assignees?.map((a: any) => a.user_id) || [])).size}
              </p>
              <Users className="h-8 w-8 text-purple-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional 4-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <h3 className="font-semibold text-sm">Pending Launch</h3>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
              {pendingCampaigns.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {pendingCampaigns.map(campaign => (
              <LaunchCampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onLaunch={handleLaunch}
                onDelete={handleDelete}
                showLaunchButton
                onCardClick={(id) => {
                  setSelectedCampaignId(id);
                  setDetailDialogOpen(true);
                }}
              />
            ))}
            {pendingCampaigns.length === 0 && (
              <Card className="p-6 text-center border-dashed">
                <p className="text-sm text-muted-foreground">No pending campaigns</p>
              </Card>
            )}
          </div>
        </div>

        {/* SocialUA Live Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <h3 className="font-semibold text-sm">SocialUA - Live</h3>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
              {socialUACampaigns.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {socialUACampaigns.map(campaign => (
              <LaunchCampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onLaunch={handleLaunch}
                onDelete={handleDelete}
                onCardClick={(id) => {
                  setSelectedCampaignId(id);
                  setDetailDialogOpen(true);
                }}
              />
            ))}
            {socialUACampaigns.length === 0 && (
              <Card className="p-6 text-center border-dashed">
                <p className="text-sm text-muted-foreground">No live campaigns</p>
              </Card>
            )}
          </div>
        </div>

        {/* PPC Live Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <h3 className="font-semibold text-sm">PPC - Live</h3>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
              {ppcCampaigns.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {ppcCampaigns.map(campaign => (
              <LaunchCampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onLaunch={handleLaunch}
                onDelete={handleDelete}
                onCardClick={(id) => {
                  setSelectedCampaignId(id);
                  setDetailDialogOpen(true);
                }}
              />
            ))}
            {ppcCampaigns.length === 0 && (
              <Card className="p-6 text-center border-dashed">
                <p className="text-sm text-muted-foreground">No live campaigns</p>
              </Card>
            )}
          </div>
        </div>

        {/* In Orbit Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <h3 className="font-semibold text-sm">In Orbit</h3>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              {orbitCampaigns.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {orbitCampaigns.map(campaign => (
              <LaunchCampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onLaunch={handleLaunch}
                onDelete={handleDelete}
                showLaunchButton={false}
                onCardClick={(id) => {
                  setSelectedCampaignId(id);
                  setDetailDialogOpen(true);
                }}
              />
            ))}
            {orbitCampaigns.length === 0 && (
              <Card className="p-6 text-center border-dashed">
                <p className="text-sm text-muted-foreground">No completed campaigns</p>
              </Card>
            )}
          </div>
        </div>

        {/* NEW: Landed (Paused) Column */}
        <div className="space-y-4 lg:col-start-2">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-500/10 rounded-lg border border-gray-500/20">
            <h3 className="font-semibold text-sm">Landed (Paused)</h3>
            <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
              {landedCampaigns.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {landedCampaigns.map(campaign => (
              <LaunchCampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onLaunch={handleLaunch}
                onDelete={handleDelete}
                showLaunchButton={false}
                onCardClick={(id) => {
                  setSelectedCampaignId(id);
                  setDetailDialogOpen(true);
                }}
              />
            ))}
            {landedCampaigns.length === 0 && (
              <Card className="p-6 text-center border-dashed">
                <p className="text-sm text-muted-foreground">No paused campaigns</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <LaunchCampaignDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={fetchCampaigns}
      />

      <LaunchCampaignDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        campaignId={selectedCampaignId}
        onUpdate={fetchCampaigns}
      />
    </div>
  );
}
