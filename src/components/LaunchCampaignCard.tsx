import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rocket, Calendar as CalendarIcon, Users, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface LaunchCampaignCardProps {
  campaign: any;
  onLaunch?: (id: string) => void;
  showLaunchButton?: boolean;
  onDelete?: (id: string) => void;
  onCardClick?: (id: string) => void;
}

export function LaunchCampaignCard({ campaign, onLaunch, showLaunchButton, onDelete, onCardClick }: LaunchCampaignCardProps) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      launchpad: { label: "On Launch Pad", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      live: { label: "Live", className: "bg-green-500/10 text-green-600 border-green-500/20" },
      orbit: { label: "In Orbit", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      landed: { label: "Landed", className: "bg-gray-500/10 text-gray-600 border-gray-500/20" }
    };
    return configs[status] || configs.launchpad;
  };

  const statusConfig = getStatusConfig(campaign.status);

  return (
    <Card 
      className="group p-5 hover:shadow-xl transition-all duration-300 border cursor-pointer bg-gradient-to-br from-background to-muted/20"
      onClick={() => onCardClick?.(campaign.id)}
    >
      <div className="space-y-4">
        {/* Header with icon and status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base line-clamp-1">{campaign.title}</h3>
              <p className="text-xs text-muted-foreground">
                {campaign.teams?.join(' • ') || 'No team assigned'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>
        
        {/* Description */}
        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 pl-11">
            {campaign.description}
          </p>
        )}
        
        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3 pl-11 text-xs">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{campaign.launch_date ? format(new Date(campaign.launch_date), 'MMM d') : 'No date'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{campaign.launch_campaign_assignees?.length || 0} crew</span>
          </div>
        </div>
        
        {/* Countries badges */}
        {campaign.entity && campaign.entity.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pl-11">
            {campaign.entity.slice(0, 3).map((country: string) => (
              <Badge key={country} variant="outline" className="text-xs bg-background">
                {country}
              </Badge>
            ))}
            {campaign.entity.length > 3 && (
              <Badge variant="outline" className="text-xs bg-background">
                +{campaign.entity.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {/* Assignees */}
        {campaign.launch_campaign_assignees && campaign.launch_campaign_assignees.length > 0 && (
          <div className="flex items-center gap-2 pl-11">
            <div className="flex -space-x-2">
              {campaign.launch_campaign_assignees.slice(0, 4).map((assignee: any) => (
                <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={assignee.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs bg-primary/10">
                    {assignee.profiles?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {campaign.launch_campaign_assignees.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{campaign.launch_campaign_assignees.length - 4} more
              </span>
            )}
          </div>
        )}
        
        {/* Footer with actions */}
        <div className="flex items-center gap-2 pt-3 border-t">
          {showLaunchButton && campaign.status === 'launchpad' && (
            <Button 
              size="sm" 
              className="flex-1 gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onLaunch(campaign.id);
              }}
            >
              <Rocket className="h-3.5 w-3.5" />
              Launch to {campaign.teams?.[0] || 'Team'}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCardClick?.(campaign.id)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(campaign.id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
