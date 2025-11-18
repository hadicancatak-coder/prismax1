import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useUpdateUtmCampaign } from "@/hooks/useUtmCampaigns";
import { Loader2 } from "lucide-react";

interface UtmCampaignDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

export function UtmCampaignDetailDialog({ open, onOpenChange, campaignId }: UtmCampaignDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [landingPage, setLandingPage] = useState("");
  const [description, setDescription] = useState("");

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["utm-campaign", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_campaigns")
        .select(`
          *,
          campaign_metadata (
            image_url,
            version_code
          )
        `)
        .eq("id", campaignId)
        .single();

      if (error) throw error;
      
      // Set initial values for editing
      setName(data.name || "");
      setLandingPage(data.landing_page || "");
      setDescription(data.description || "");
      
      return data;
    },
    enabled: open && !!campaignId,
  });

  const updateMutation = useUpdateUtmCampaign();

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: campaignId,
      name,
      landing_page: landingPage || null,
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Details</DialogTitle>
          <DialogDescription>
            View and edit campaign information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm font-medium">{campaign.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="landing-page">Landing Page</Label>
            {isEditing ? (
              <Input
                id="landing-page"
                value={landingPage}
                onChange={(e) => setLandingPage(e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm break-all">
                {campaign.landing_page || <span className="text-muted-foreground">Not set</span>}
              </p>
            )}
          </div>

          {campaign.description && (
            <div>
              <Label>Description</Label>
              <p className="mt-1 text-sm text-muted-foreground">{campaign.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Usage Count</Label>
              <p className="mt-1 text-sm font-medium">{campaign.usage_count || 0}</p>
            </div>

            <div>
              <Label>Created</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(new Date(campaign.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {campaign.last_used_at && (
            <div>
              <Label>Last Used</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(new Date(campaign.last_used_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          )}

          {campaign.campaign_metadata && (
            <div>
              <Label>Metadata</Label>
              <div className="mt-1 space-y-2">
                {campaign.campaign_metadata.image_url && (
                  <div>
                    <span className="text-xs text-muted-foreground">Image: </span>
                    <a
                      href={campaign.campaign_metadata.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View Image
                    </a>
                  </div>
                )}
                {campaign.campaign_metadata.version_code && (
                  <div>
                    <span className="text-xs text-muted-foreground">Version: </span>
                    <span className="text-xs">{campaign.campaign_metadata.version_code}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Campaign
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
