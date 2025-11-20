import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchAdPreview } from "@/components/ads/SearchAdPreview";
import { ChevronDown, Target, Calendar, DollarSign, Globe } from "lucide-react";
import { useMemo } from "react";

interface CampaignPreviewPanelProps {
  campaign: any;
  adGroups: any[];
  ads: any[];
  entity: string;
  onViewAllAds?: () => void;
}

export function CampaignPreviewPanel({ 
  campaign, 
  adGroups, 
  ads, 
  entity,
  onViewAllAds 
}: CampaignPreviewPanelProps) {
  
  // Get a sample ad for preview
  const sampleAd = useMemo(() => {
    if (ads.length === 0) return null;
    // Pick a random ad to show variety
    const randomIndex = Math.floor(Math.random() * ads.length);
    return ads[randomIndex];
  }, [ads]);

  // Calculate status distribution
  const statusCounts = useMemo(() => {
    const counts = {
      draft: 0,
      active: 0,
      paused: 0,
    };
    
    ads.forEach(ad => {
      const status = ad.approval_status || 'draft';
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });
    
    return counts;
  }, [ads]);

  // Calculate average character usage
  const avgCharUsage = useMemo(() => {
    if (ads.length === 0) return { headlines: 0, descriptions: 0 };
    
    let totalHeadlineChars = 0;
    let totalHeadlineCount = 0;
    let totalDescChars = 0;
    let totalDescCount = 0;
    
    ads.forEach(ad => {
      if (Array.isArray(ad.headlines)) {
        ad.headlines.forEach((h: string) => {
          if (h?.trim()) {
            totalHeadlineChars += h.length;
            totalHeadlineCount++;
          }
        });
      }
      
      if (Array.isArray(ad.descriptions)) {
        ad.descriptions.forEach((d: string) => {
          if (d?.trim()) {
            totalDescChars += d.length;
            totalDescCount++;
          }
        });
      }
    });
    
    return {
      headlines: totalHeadlineCount > 0 ? Math.round(totalHeadlineChars / totalHeadlineCount) : 0,
      descriptions: totalDescCount > 0 ? Math.round(totalDescChars / totalDescCount) : 0,
    };
  }, [ads]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b p-md">
        <h2 className="text-heading-md font-semibold mb-1">{campaign.name}</h2>
        <p className="text-body-sm text-muted-foreground">Campaign Overview</p>
      </div>

      <div className="flex-1 overflow-y-auto p-md space-y-md">
        {/* Campaign Info Cards */}
        <div className="grid grid-cols-2 gap-sm">
          <Card className="p-sm border-border/50">
            <div className="flex items-center gap-sm mb-xs">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-metadata font-medium text-muted-foreground">Entity</span>
            </div>
            <p className="text-body font-semibold">{entity}</p>
          </Card>

          <Card className="p-sm border-border/50">
            <div className="flex items-center gap-sm mb-xs">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-metadata font-medium text-muted-foreground">Languages</span>
            </div>
            <p className="text-body font-semibold">
              {campaign.languages?.join(', ') || 'EN'}
            </p>
          </Card>

          {campaign.budget_monthly && (
            <Card className="p-sm border-border/50">
              <div className="flex items-center gap-sm mb-xs">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-metadata font-medium text-muted-foreground">Budget</span>
              </div>
              <p className="text-body font-semibold">${campaign.budget_monthly}/mo</p>
            </Card>
          )}

          <Card className="p-sm border-border/50">
            <div className="flex items-center gap-sm mb-xs">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-metadata font-medium text-muted-foreground">Status</span>
            </div>
            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
              {campaign.status || 'draft'}
            </Badge>
          </Card>
        </div>

        {/* Campaign Stats */}
        <Card className="p-md border-border/50">
          <h3 className="text-body-sm font-semibold mb-sm">Campaign Statistics</h3>
          <div className="space-y-sm">
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-muted-foreground">Ad Groups</span>
              <Badge variant="secondary">{adGroups.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-muted-foreground">Total Ads</span>
              <Badge variant="secondary">{ads.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-muted-foreground">Avg Headline Length</span>
              <span className="text-body-sm font-medium">{avgCharUsage.headlines} chars</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-muted-foreground">Avg Description Length</span>
              <span className="text-body-sm font-medium">{avgCharUsage.descriptions} chars</span>
            </div>
          </div>
        </Card>

        {/* Status Distribution */}
        <Card className="p-md border-border/50">
          <h3 className="text-body-sm font-semibold mb-sm">Status Distribution</h3>
          <div className="space-y-xs">
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-muted-foreground">Draft</span>
              <Badge variant="outline">{statusCounts.draft}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-muted-foreground">Active</span>
              <Badge variant="default">{statusCounts.active}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-muted-foreground">Paused</span>
              <Badge variant="secondary">{statusCounts.paused}</Badge>
            </div>
          </div>
        </Card>

        {/* Sample Ad Preview */}
        {sampleAd && (
          <Card className="p-md border-border/50">
            <h3 className="text-body-sm font-semibold mb-sm flex items-center gap-2">
              Sample Ad Preview
              <Badge variant="outline" className="text-xs">Random</Badge>
            </h3>
            <div className="bg-muted/30 rounded-lg p-sm">
              <SearchAdPreview
                headlines={sampleAd.headlines || []}
                descriptions={sampleAd.descriptions || []}
                sitelinks={sampleAd.sitelinks || []}
                landingPage={sampleAd.landing_page || ''}
                businessName={sampleAd.business_name || ''}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-sm">
              Ad: {sampleAd.name}
            </p>
          </Card>
        )}

        {/* Action Button */}
        {ads.length > 0 && (
          <Button 
            onClick={onViewAllAds}
            variant="outline" 
            className="w-full"
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            View All {ads.length} Ads
          </Button>
        )}

        {ads.length === 0 && (
          <Card className="p-lg border-dashed text-center">
            <p className="text-body-sm text-muted-foreground">
              No ads in this campaign yet.
            </p>
            <p className="text-metadata text-muted-foreground mt-xs">
              Create ad groups and ads to see them here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
