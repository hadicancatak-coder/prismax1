import { useState } from "react";
import { usePlannedCampaigns, calculateDuration } from "@/hooks/usePlannedCampaigns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignDetailDialog } from "./CampaignDetailDialog";
import { Calendar, DollarSign, MapPin, Package } from "lucide-react";
import { PlannedCampaign } from "@/hooks/usePlannedCampaigns";

export function CampaignsSection() {
  const { campaigns, isLoading } = usePlannedCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<PlannedCampaign | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleViewCampaign = (campaign: PlannedCampaign) => {
    setSelectedCampaign(campaign);
    setDetailOpen(true);
  };

  if (isLoading) {
    return <div>Loading campaigns...</div>;
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Campaigns Yet</h3>
        <p className="text-muted-foreground mb-4">
          Start planning your first campaign using the "Plan Campaign" button above
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => {
          const duration = calculateDuration(campaign.start_date, campaign.end_date);
          
          return (
          <Card 
            key={campaign.id} 
            interactive
            onClick={() => handleViewCampaign(campaign)}
          >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <Badge variant={
                    campaign.status === 'active' ? 'default' : 
                    campaign.status === 'completed' ? 'secondary' : 
                    'outline'
                  }>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Budget: AED {campaign.budget.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{campaign.cities.join(', ')}</span>
                </div>

                {campaign.agency && (
                  <div className="text-sm text-muted-foreground">
                    Agency: {campaign.agency}
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Duration: {duration} month{duration !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CampaignDetailDialog
        campaign={selectedCampaign}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedCampaign(null);
        }}
      />
    </>
  );
}
