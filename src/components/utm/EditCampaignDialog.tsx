import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateUtmCampaign } from '@/hooks/useUtmCampaigns';
import type { UtmCampaign } from '@/hooks/useUtmCampaigns';

interface EditCampaignDialogProps {
  campaign: UtmCampaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCampaignDialog({ campaign, open, onOpenChange }: EditCampaignDialogProps) {
  const [name, setName] = useState(campaign.name);
  const [landingPage, setLandingPage] = useState(campaign.landing_page || '');
  const updateCampaign = useUpdateUtmCampaign();

  useEffect(() => {
    setName(campaign.name);
    setLandingPage(campaign.landing_page || '');
  }, [campaign]);

  const handleSave = () => {
    if (!name.trim()) return;

    updateCampaign.mutate({
      id: campaign.id,
      name: name.trim(),
      landing_page: landingPage.trim() || null,
    }, {
      onSuccess: () => onOpenChange(false)
    });
  };

  const isValidUrl = (url: string) => {
    if (!url) return true; // Empty is valid
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name *</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landing-page">Default Landing Page</Label>
            <Input
              id="landing-page"
              type="url"
              value={landingPage}
              onChange={(e) => setLandingPage(e.target.value)}
              placeholder="https://cfi.trade/jo/open-account"
            />
            {landingPage && !isValidUrl(landingPage) && (
              <p className="text-sm text-destructive">Please enter a valid URL</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || (landingPage && !isValidUrl(landingPage))}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
