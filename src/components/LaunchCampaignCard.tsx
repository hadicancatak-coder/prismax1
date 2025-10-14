import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rocket, ExternalLink, MoreVertical, ListTodo } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LaunchCampaignCardProps {
  campaign: any;
  onLaunch: (id: string) => void;
  showLaunchButton?: boolean;
  onConvertToTask?: (campaign: any) => void;
}

export function LaunchCampaignCard({ campaign, onLaunch, showLaunchButton, onConvertToTask }: LaunchCampaignCardProps) {
  const statusConfig = {
    live: { label: "🛰️ In Orbit", className: "bg-success/10 text-success border-success/20" },
    pending: { label: "🚀 Ready for Liftoff", className: "bg-warning/10 text-warning border-warning/20" },
    stopped: { label: "☄️ Mission Paused", className: "bg-muted text-muted-foreground border-border" }
  };

  const config = statusConfig[campaign.status as keyof typeof statusConfig];

  return (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2">{campaign.title}</h3>
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        </div>

        {campaign.teams && (
          <div className="flex gap-1 flex-wrap">
            {campaign.teams.map((team: string) => (
              <Badge key={team} variant="secondary" className="text-xs">
                {team}
              </Badge>
            ))}
          </div>
        )}

        {campaign.launch_month && (
          <p className="text-xs text-muted-foreground">📅 {campaign.launch_month}</p>
        )}

        {campaign.lp_url && (
          <a 
            href={campaign.lp_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Landing Page
          </a>
        )}

        {campaign.launch_campaign_assignees && campaign.launch_campaign_assignees.length > 0 && (
          <div className="flex -space-x-2">
            {campaign.launch_campaign_assignees.slice(0, 3).map((assignee: any) => (
              <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={assignee.profiles?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {assignee.profiles?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            ))}
            {campaign.launch_campaign_assignees.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                +{campaign.launch_campaign_assignees.length - 3}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onConvertToTask?.(campaign)}>
                <ListTodo className="mr-2 h-4 w-4" />
                Convert to Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {showLaunchButton && campaign.status === 'pending' && (
            <Button 
              size="sm" 
              className="flex-1" 
              onClick={() => onLaunch(campaign.id)}
            >
              <Rocket className="mr-2 h-3 w-3" />
              Launch
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
