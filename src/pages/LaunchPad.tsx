import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Rocket, Satellite, PauseCircle } from "lucide-react";
import { LaunchCampaignDialog } from "@/components/LaunchCampaignDialog";
import { LaunchCampaignCard } from "@/components/LaunchCampaignCard";
import { format } from "date-fns";

export default function LaunchPad() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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
      const { error } = await supabase
        .from('launch_pad_campaigns')
        .update({ status: 'live', launched_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "🚀 Mission launched successfully", description: "Mission is now live in orbit" });
    } catch (error: any) {
      toast({ title: "Launch failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const campaign = campaigns.find(c => c.id === id);
      const confirmed = confirm(
        `Delete "${campaign?.title}"?\n\n` +
        `This will permanently remove the mission and cannot be undone.`
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
        title: "Mission deleted", 
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

  const buildTaskDescription = (campaign: any) => {
    let desc = `## 🚀 Campaign Launch Mission\n\n`;
    desc += `**Mission:** ${campaign.title}\n\n`;
    
    if (campaign.description) {
      desc += `**Mission Brief:**\n${campaign.description}\n\n`;
    }
    
    if (campaign.teams?.length > 0) {
      desc += `**Launch Teams:** ${campaign.teams.join(', ')}\n`;
    }
    
    if (campaign.entity?.length > 0) {
      desc += `**Target Countries:** ${campaign.entity.join(', ')}\n`;
    }
    
    if (campaign.launch_date) {
      desc += `**Launch Date:** ${format(new Date(campaign.launch_date), 'MMMM dd, yyyy')}\n`;
    }
    
    desc += `\n---\n\n`;
    
    if (campaign.lp_url) {
      desc += `**Landing Page:** ${campaign.lp_url}\n`;
    }
    
    if (campaign.creatives_link) {
      desc += `**Creative Assets:** ${campaign.creatives_link}\n`;
    }
    
    if (campaign.captions) {
      desc += `\n**Ad Copy & Captions:**\n${campaign.captions}\n`;
    }
    
    return desc;
  };

  const handleConvertToTask = async (campaign: any) => {
    try {
      const confirmed = confirm(
        `Convert "${campaign.title}" to a task?\n\n` +
        `This will create a task and assign it to ${campaign.launch_campaign_assignees?.length || 0} team member(s). ` +
        `The mission status will be set to Live.`
      );
      if (!confirmed) return;

      // Create task with full campaign details
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: `🚀 ${campaign.title}`,
          description: buildTaskDescription(campaign),
          task_type: 'campaign_launch',
          campaign_id: campaign.id,
          status: 'Pending',
          priority: 'High',
          entity: campaign.entity || [],
          due_at: campaign.launch_date || null,
          created_by: user?.id,
          labels: ['campaign', ...(campaign.teams || [])]
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Assign to all campaign assignees
      if (campaign.launch_campaign_assignees?.length > 0) {
        const assignments = campaign.launch_campaign_assignees.map((assignee: any) => ({
          task_id: newTask.id,
          user_id: assignee.user_id,
          assigned_by: user?.id
        }));
        
        await supabase.from('task_assignees').insert(assignments);
        
        // Notify all assignees
        const notifications = campaign.launch_campaign_assignees.map((assignee: any) => ({
          user_id: assignee.user_id,
          type: 'task_assigned',
          payload_json: {
            task_id: newTask.id,
            task_title: newTask.title,
            assigned_by: user?.id,
            campaign_id: campaign.id,
            message: `Mission "${campaign.title}" has been converted to a task`
          }
        }));
        
        await supabase.from('notifications').insert(notifications);
      }

      // Mark campaign as converted AND set to live
      await supabase
        .from('launch_pad_campaigns')
        .update({ 
          converted_to_task: true,
          task_id: newTask.id,
          status: 'live',
          launched_at: new Date().toISOString()
        })
        .eq('id', campaign.id);

      toast({ 
        title: "Mission converted to task successfully", 
        description: `Task created and ${campaign.launch_campaign_assignees?.length || 0} crew member(s) notified`,
      });
      
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: "Conversion failed", description: error.message, variant: "destructive" });
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
            Campaign Launch Pad
          </h1>
          <p className="text-muted-foreground mt-1">Mission control for creating, tracking, and launching campaigns</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          New Mission
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Missions</div>
          <div className="text-2xl font-bold">{campaigns.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">🚧 In Prep</div>
          <div className="text-2xl font-bold">{pendingCampaigns.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">🛰️ Live</div>
          <div className="text-2xl font-bold">{inOrbitCampaigns.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Crew Members</div>
          <div className="text-2xl font-bold">
            {new Set(campaigns.flatMap(c => c.launch_campaign_assignees?.map((a: any) => a.user_id) || [])).size}
          </div>
        </Card>
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
                onConvertToTask={handleConvertToTask}
                onDelete={handleDelete}
              />
            ))}
            {socialUACampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No missions in this phase</p>
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
                onConvertToTask={handleConvertToTask}
                onDelete={handleDelete}
              />
            ))}
            {ppcCampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No missions in this phase</p>
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
                onConvertToTask={handleConvertToTask}
                onDelete={handleDelete}
                showLaunchButton
              />
            ))}
            {pendingCampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">All missions cleared for launch</p>
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
                onConvertToTask={handleConvertToTask}
                onDelete={handleDelete}
              />
            ))}
            {inOrbitCampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No missions currently in orbit</p>
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
