import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface CampaignCardProps {
  campaign: any;
  onClick: () => void;
}

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (campaign.image_url) {
      const fileName = campaign.image_url.includes('/') 
        ? campaign.image_url.split('/').pop() 
        : campaign.image_url;
      
      supabase.storage
        .from("campaigns")
        .createSignedUrl(fileName, 3600)
        .then(({ data }) => {
          if (data) setImageUrl(data.signedUrl);
        });
    }
  }, [campaign.image_url]);

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={campaign.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {campaign.title}
        </h3>
        {campaign.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {campaign.description}
          </p>
        )}
        <div className="space-y-2 text-sm">
          {campaign.entity && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entity:</span>
              <span className="font-medium">{campaign.entity}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target:</span>
            <span className="font-medium">{campaign.target}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start:</span>
            <span className="font-medium">
              {format(new Date(campaign.start_date), "MMM dd, yyyy")}
            </span>
          </div>
          {campaign.end_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">End:</span>
              <span className="font-medium">
                {format(new Date(campaign.end_date), "MMM dd, yyyy")}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
