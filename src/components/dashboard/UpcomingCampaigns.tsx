import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export function UpcomingCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    fetchMyCampaigns();

    const channel = supabase
      .channel('my-campaigns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'launch_pad_campaigns' }, () => {
        fetchMyCampaigns();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchMyCampaigns = async () => {
    if (!user?.id) return;
    
    // Get user's profile.id from auth user_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    const { data } = await supabase
      .from('launch_campaign_assignees')
      .select(`
        campaign_id,
        launch_pad_campaigns (
          id,
          title,
          status,
          launch_date,
          teams,
          entity,
          lp_url
        )
      `)
      .eq('user_id', profile.id);

    const activeCampaigns = data
      ?.map(d => d.launch_pad_campaigns)
      .filter(c => c && (c.status === 'live' || c.status === 'orbit'))
      .slice(0, 5) || [];

    setCampaigns(activeCampaigns);
  };

  if (campaigns.length === 0) return null;

  return (
    <div className="border-l-2 border-primary pl-6">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="h-5 w-5 text-primary" />
        <h2 className="text-section-title text-foreground">🚀 Your Mission Launches</h2>
        <Badge variant="outline">{campaigns.length}</Badge>
      </div>
      
      <div className="space-y-3">
        {campaigns.map((campaign: any) => (
          <div
            key={campaign.id}
            className="py-3 border-b border-border last:border-0 hover:opacity-80 transition-smooth"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-medium text-body mb-2">{campaign.title}</h3>
                <div className="flex gap-2 flex-wrap">
                  {campaign.teams?.map((team: string) => (
                    <Badge key={team} variant="secondary" className="text-xs">
                      {team}
                    </Badge>
                  ))}
                  {campaign.entity?.slice(0, 2).map((country: string) => (
                    <Badge key={country} variant="outline" className="text-xs">
                      🌍 {country}
                    </Badge>
                  ))}
                  {campaign.entity?.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{campaign.entity.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline">
                  {campaign.status === 'live' ? '🛰️ Live' : '🚧 Prep'}
                </Badge>
                {campaign.launch_date && (
                  <span className="text-metadata flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(campaign.launch_date), 'MMM dd')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
