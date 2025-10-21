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
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="h-8 w-8 text-primary" />
            Launch Pad
          </h1>
          <p className="text-muted-foreground mt-1">Mission Control - Manage and track your campaign launches</p>
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
              <Clock className="h-8 w-8 text-amber-500/20" />
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

      {/* Active Campaign Columns - 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending Launch */}
        <Card className="border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Launch
              <Badge variant="secondary" className="ml-auto">{pendingCampaigns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-450px)] pr-4">
              <div className="space-y-3">
                {pendingCampaigns.map((campaign) => (
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
                {pendingCampaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Rocket className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No pending campaigns</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* SocialUA - Live */}
        <Card className="border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-500" />
              SocialUA - Live
              <Badge variant="secondary" className="ml-auto">{socialUACampaigns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-450px)] pr-4">
              <div className="space-y-3">
                {socialUACampaigns.map((campaign) => (
                  <LaunchCampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onDelete={handleDelete}
                    onCardClick={(id) => {
                      setSelectedCampaignId(id);
                      setDetailDialogOpen(true);
                    }}
                  />
                ))}
                {socialUACampaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Share2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No live SocialUA campaigns</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* PPC - Live */}
        <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-background">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              PPC - Live
              <Badge variant="secondary" className="ml-auto">{ppcCampaigns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-450px)] pr-4">
              <div className="space-y-3">
                {ppcCampaigns.map((campaign) => (
                  <LaunchCampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onDelete={handleDelete}
                    onCardClick={(id) => {
                      setSelectedCampaignId(id);
                      setDetailDialogOpen(true);
                    }}
                  />
                ))}
                {ppcCampaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No live PPC campaigns</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* In Orbit - Table List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-green-500" />
            In Orbit Campaigns
            <Badge variant="secondary" className="ml-2">{orbitCampaigns.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orbitCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Radio className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No campaigns in orbit</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Campaign</TableHead>
                  <TableHead className="w-[15%]">Teams</TableHead>
                  <TableHead className="w-[20%]">Entities</TableHead>
                  <TableHead className="w-[15%]">Launch Date</TableHead>
                  <TableHead className="w-[10%]">Crew</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orbitCampaigns.map((campaign) => (
                  <TableRow 
                    key={campaign.id} 
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedCampaignId(campaign.id);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{campaign.title}</p>
                        {campaign.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.teams?.map((team: string) => (
                          <Badge key={team} variant="outline" className="text-xs">{team}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.entity?.map((ent: string) => (
                          <Badge key={ent} variant="secondary" className="text-xs">{ent}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {campaign.launch_date ? format(new Date(campaign.launch_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {campaign.launch_campaign_assignees?.slice(0, 3).map((assignee: any) => (
                          <Avatar key={assignee.user_id} className="h-7 w-7 border-2 border-background">
                            <AvatarImage src={assignee.profiles?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {assignee.profiles?.name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {campaign.launch_campaign_assignees?.length > 3 && (
                          <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{campaign.launch_campaign_assignees.length - 3}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(campaign.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Landed (Paused) - Table List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PauseCircle className="h-5 w-5 text-gray-500" />
            Landed (Paused) Campaigns
            <Badge variant="secondary" className="ml-2">{landedCampaigns.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {landedCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PauseCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No landed campaigns</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Campaign</TableHead>
                  <TableHead className="w-[15%]">Teams</TableHead>
                  <TableHead className="w-[20%]">Entities</TableHead>
                  <TableHead className="w-[15%]">Launch Date</TableHead>
                  <TableHead className="w-[10%]">Crew</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landedCampaigns.map((campaign) => (
                  <TableRow 
                    key={campaign.id} 
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedCampaignId(campaign.id);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{campaign.title}</p>
                        {campaign.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.teams?.map((team: string) => (
                          <Badge key={team} variant="outline" className="text-xs">{team}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.entity?.map((ent: string) => (
                          <Badge key={ent} variant="secondary" className="text-xs">{ent}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {campaign.launch_date ? format(new Date(campaign.launch_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {campaign.launch_campaign_assignees?.slice(0, 3).map((assignee: any) => (
                          <Avatar key={assignee.user_id} className="h-7 w-7 border-2 border-background">
                            <AvatarImage src={assignee.profiles?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {assignee.profiles?.name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {campaign.launch_campaign_assignees?.length > 3 && (
                          <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{campaign.launch_campaign_assignees.length - 3}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(campaign.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
