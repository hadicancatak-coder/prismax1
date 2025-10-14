import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Rocket, ExternalLink, MoreVertical, ListTodo, Trash2, Calendar, ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface LaunchCampaignCardProps {
  campaign: any;
  onLaunch: (id: string) => void;
  showLaunchButton?: boolean;
  onConvertToTask?: (campaign: any) => void;
  onDelete?: (id: string) => void;
  onCardClick?: (id: string) => void;
}

export function LaunchCampaignCard({ campaign, onLaunch, showLaunchButton, onConvertToTask, onDelete, onCardClick }: LaunchCampaignCardProps) {
  const statusConfig = {
    live: { label: "🛰️ Live", className: "bg-success/10 text-success border-success/20" },
    pending: { label: "🚧 Prep", className: "bg-warning/10 text-warning border-warning/20" },
    stopped: { label: "☄️ Paused", className: "bg-muted text-muted-foreground border-border" }
  };

  const config = statusConfig[campaign.status as keyof typeof statusConfig];

  return (
    <Card 
      className="p-4 hover:shadow-lg transition-all border-l-4 border-l-primary/30 cursor-pointer"
      onClick={() => onCardClick?.(campaign.id)}
    >
      <div className="space-y-3">
        {/* Header: Title + Status */}
        <div className="flex items-start justify-between gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                {campaign.title}
              </h3>
            </TooltipTrigger>
            <TooltipContent>{campaign.title}</TooltipContent>
          </Tooltip>
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        </div>

        {/* Description */}
        {campaign.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}

        {/* Teams */}
        {campaign.teams && campaign.teams.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {campaign.teams.map((team: string) => (
              <Badge key={team} variant="secondary" className="text-xs">
                {team}
              </Badge>
            ))}
          </div>
        )}

        {/* Countries */}
        {campaign.entity && campaign.entity.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {campaign.entity.map((country: string) => (
              <Badge key={country} variant="outline" className="text-xs">
                🌍 {country}
              </Badge>
            ))}
          </div>
        )}

        {/* Launch Date */}
        {campaign.launch_date && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Launch: {format(new Date(campaign.launch_date), 'MMM dd, yyyy')}
          </p>
        )}

        {/* Links Section */}
        {(campaign.lp_url || campaign.creatives_link) && (
          <div className="flex gap-3 text-xs border-t pt-2">
            {campaign.lp_url && (
              <a 
                href={campaign.lp_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                Landing Page
              </a>
            )}
            {campaign.creatives_link && (
              <a 
                href={campaign.creatives_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageIcon className="h-3 w-3" />
                Creatives
              </a>
            )}
          </div>
        )}

        {/* Assignees with Count */}
        {campaign.launch_campaign_assignees && campaign.launch_campaign_assignees.length > 0 && (
          <div className="flex items-center gap-2 border-t pt-2">
            <div className="flex -space-x-2">
              {campaign.launch_campaign_assignees.slice(0, 3).map((assignee: any) => (
                <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={assignee.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {assignee.profiles?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {campaign.launch_campaign_assignees.length} crew member{campaign.launch_campaign_assignees.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showLaunchButton && campaign.status === 'pending' && (
            <Button 
              size="sm" 
              className="flex-1" 
              onClick={(e) => {
                e.stopPropagation();
                onLaunch(campaign.id);
              }}
            >
              <Rocket className="mr-2 h-3 w-3" />
              Launch Mission
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onConvertToTask?.(campaign);
              }}>
                <ListTodo className="mr-2 h-4 w-4" />
                Convert to Task
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(campaign.id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Mission
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
