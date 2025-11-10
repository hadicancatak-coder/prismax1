import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface DeleteCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: any;
  adGroupsCount: number;
  adsCount: number;
  onSuccess: () => void;
}

export function DeleteCampaignDialog({ open, onOpenChange, campaign, adGroupsCount, adsCount, onSuccess }: DeleteCampaignDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== campaign.name) {
      toast.error("Campaign name does not match");
      return;
    }

    setIsDeleting(true);
    try {
      // Delete all ads first
      if (adsCount > 0) {
        const { error: adsError } = await supabase
          .from('ads')
          .delete()
          .in('ad_group_id', 
            await supabase
              .from('ad_groups')
              .select('id')
              .eq('campaign_id', campaign.id)
              .then(res => res.data?.map(ag => ag.id) || [])
          );

        if (adsError) throw adsError;
      }

      // Then delete all ad groups
      if (adGroupsCount > 0) {
        const { error: adGroupsError } = await supabase
          .from('ad_groups')
          .delete()
          .eq('campaign_id', campaign.id);

        if (adGroupsError) throw adGroupsError;
      }

      // Finally delete the campaign
      const { error } = await supabase
        .from('ad_campaigns')
        .delete()
        .eq('id', campaign.id);

      if (error) throw error;

      toast.success(`Campaign "${campaign.name}" deleted successfully (${adGroupsCount} ad groups, ${adsCount} ads)`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete campaign");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Campaign
          </DialogTitle>
          <DialogDescription>
            This is a destructive action that cannot be undone.
            <span className="block mt-2 font-semibold text-destructive">
              This will delete:
            </span>
            <ul className="list-disc list-inside mt-1 text-destructive">
              <li>{adGroupsCount} ad group(s)</li>
              <li>{adsCount} ad(s)</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-campaign-name">
            Type <span className="font-mono font-semibold">{campaign?.name}</span> to confirm
          </Label>
          <Input
            id="confirm-campaign-name"
            placeholder="Enter campaign name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting || confirmText !== campaign?.name}
          >
            {isDeleting ? "Deleting..." : "Delete Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
