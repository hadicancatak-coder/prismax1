import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCreateUtmCampaign } from "@/hooks/useUtmCampaigns";
import { Plus } from "lucide-react";

interface AddCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddCampaignDialog = ({ open, onOpenChange }: AddCampaignDialogProps) => {
  const [campaignName, setCampaignName] = useState("");
  const [landingPage, setLandingPage] = useState("");
  const createCampaign = useCreateUtmCampaign();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) return;

    try {
      await createCampaign.mutateAsync({ name: campaignName.trim(), landingPage: landingPage.trim() || undefined });
      setCampaignName("");
      setLandingPage("");
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Campaign</DialogTitle>
          <DialogDescription>
            Create a new campaign to use in your UTM links
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Gold, Stocks, FOREX"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landing-page">Default Landing Page (optional)</Label>
            <Input
              id="landing-page"
              type="url"
              value={landingPage}
              onChange={(e) => setLandingPage(e.target.value)}
              placeholder="https://cfi.trade/jo/open-account"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!campaignName.trim() || createCampaign.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
