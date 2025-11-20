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
    <div className="h-full flex flex-col bg-muted/30">
      <div className="border-b bg-background p-md">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-heading-md font-semibold truncate mb-xs">{campaign.name}</h2>
            <div className="flex items-center gap-sm flex-wrap">
              <Badge variant="outline" className="gap-xs">
                <Target className="h-3 w-3" />
                {entity}
              </Badge>
              <Badge variant="outline" className="gap-xs">
                <Globe className="h-3 w-3" />
                {campaign.languages?.join(', ') || 'EN'}
              </Badge>
              {campaign.budget_monthly && (
                <Badge variant="outline" className="gap-xs">
                  <DollarSign className="h-3 w-3" />
                  ${campaign.budget_monthly}/mo
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-md space-y-md">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-sm">
          <Card className="p-sm bg-card hover:bg-accent/50 transition-smooth border-l-4 border-l-primary">
            <p className="text-metadata text-muted-foreground mb-xs">Ad Groups</p>
            <p className="text-heading-lg font-bold">{adGroups.length}</p>
          </Card>

          <Card className="p-sm bg-card hover:bg-accent/50 transition-smooth border-l-4 border-l-success">
            <p className="text-metadata text-muted-foreground mb-xs">Total Ads</p>
            <p className="text-heading-lg font-bold">{ads.length}</p>
          </Card>
          
          <Card className="p-sm bg-card hover:bg-accent/50 transition-smooth border-l-4 border-l-warning">
            <p className="text-metadata text-muted-foreground mb-xs">Active</p>
            <p className="text-heading-lg font-bold text-success">{statusCounts.active}</p>
          </Card>
        </div>

        {/* Quality Metrics */}
        <Card className="p-md border-border">
          <h3 className="text-body font-semibold mb-md flex items-center gap-xs">
            <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
            Quality Metrics
          </h3>
          
          <div className="space-y-md">
            <div className="flex items-center justify-between p-sm bg-muted/50 rounded-md">
              <span className="text-body-sm text-muted-foreground">Avg Headline Length</span>
              <div className="text-right">
                <span className="text-body font-semibold">{avgCharUsage.headlines}</span>
                <span className="text-metadata text-muted-foreground"> / 30 chars</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-sm bg-muted/50 rounded-md">
              <span className="text-body-sm text-muted-foreground">Avg Description Length</span>
              <div className="text-right">
                <span className="text-body font-semibold">{avgCharUsage.descriptions}</span>
                <span className="text-metadata text-muted-foreground"> / 90 chars</span>
              </div>
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
