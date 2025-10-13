import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, ExternalLink, Building2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface CampaignDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

export function CampaignDetailDialog({ open, onOpenChange, campaignId }: CampaignDetailDialogProps) {
  const [campaign, setCampaign] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && campaignId) {
      fetchCampaign();
    }
  }, [open, campaignId]);

  const fetchCampaign = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (!error && data) {
      setCampaign(data);
      
      // Get signed URL for private image
      if (data.image_url) {
        const fileName = data.image_url.split('/').pop();
        const { data: signedData } = await supabase.storage
          .from("campaigns")
          .createSignedUrl(fileName, 3600); // 1 hour expiry
        
        if (signedData) {
          setImageUrl(signedData.signedUrl);
        }
      }
    }
    setLoading(false);
  };

  if (loading || !campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{campaign.title}</DialogTitle>
          <DialogDescription>Campaign details and information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt={campaign.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {campaign.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{campaign.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {campaign.entity && (
              <div className="flex items-start gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Entity</p>
                  <p className="font-medium">{campaign.entity}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <Badge variant="outline">{campaign.target}</Badge>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {format(new Date(campaign.start_date), "MMM dd, yyyy")}
                </p>
              </div>
            </div>

            {campaign.end_date && (
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {format(new Date(campaign.end_date), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {campaign.lp_link && (
            <div>
              <h3 className="font-semibold mb-2">Landing Page</h3>
              <a
                href={campaign.lp_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                {campaign.lp_link}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
