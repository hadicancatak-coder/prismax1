import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlannedCampaigns, PlannedCampaign, calculateDuration } from "@/hooks/usePlannedCampaigns";
import { MapPin, Building2, Calendar, Search, Plus, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { getStatusColor, getStatusBadgeVariant } from "@/lib/constants";

interface CampaignsListDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onViewCampaign?: (campaignId: string) => void;
}

export function CampaignsListDialog({ 
  open, 
  onClose, 
  onCreateNew,
  onViewCampaign 
}: CampaignsListDialogProps) {
  const { campaigns } = usePlannedCampaigns();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Status functions now centralized in constants.ts

  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter(campaign => {
        const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [campaigns, searchTerm, statusFilter]);

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      return `${format(new Date(startDate), "MMM d")} → ${format(new Date(endDate), "MMM d, yyyy")}`;
    } catch {
      return "Date not set";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Your Campaigns</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaign List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "No campaigns match your filters" 
                    : "No campaigns created yet"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={onCreateNew} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                )}
              </div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <Card 
                  key={campaign.id} 
                  className="p-4 hover:bg-muted/50 transition-all cursor-pointer"
                  onClick={() => onViewCampaign?.(campaign.id)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 truncate">{campaign.name}</h3>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <Badge variant={getStatusBadgeVariant(campaign.status)} className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateRange(campaign.start_date, campaign.end_date)}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-xs">
                            {calculateDuration(campaign.start_date, campaign.end_date)} months
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">{campaign.cities.join(", ")}</span>
                        </div>
                        {campaign.agency && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>{campaign.agency}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
