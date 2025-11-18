import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator, 
  ContextMenuTrigger 
} from "@/components/ui/context-menu";
import { Plus, Target, Sparkles, FolderOpen, Building2 } from "lucide-react";

interface MapContextMenuProps {
  children: React.ReactNode;
  onAddLocation: () => void;
  onCreateCampaignSelect: () => void;
  onCreateCampaign: () => void;
  onViewCampaigns: () => void;
  onViewVendors: () => void;
  isAdmin?: boolean;
}

export function MapContextMenu({
  children,
  onAddLocation,
  onCreateCampaignSelect,
  onCreateCampaign,
  onViewCampaigns,
  onViewVendors,
  isAdmin = false,
}: MapContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-60 bg-card border-border shadow-lg z-[99999]">
        {isAdmin && (
          <>
            <ContextMenuItem onClick={onAddLocation} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={onCreateCampaignSelect} className="cursor-pointer">
          <Target className="h-4 w-4 mr-2" />
          Create Campaign (Select)
        </ContextMenuItem>
        <ContextMenuItem onClick={onCreateCampaign} className="cursor-pointer">
          <Sparkles className="h-4 w-4 mr-2" />
          Create Campaign
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onViewCampaigns} className="cursor-pointer">
          <FolderOpen className="h-4 w-4 mr-2" />
          Saved Campaigns
        </ContextMenuItem>
        <ContextMenuItem onClick={onViewVendors} className="cursor-pointer">
          <Building2 className="h-4 w-4 mr-2" />
          Vendors
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
