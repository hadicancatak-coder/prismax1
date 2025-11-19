import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useCreateUtmCampaign } from "@/hooks/useUtmCampaigns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateUtmCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUtmCampaignDialog({ open, onOpenChange }: CreateUtmCampaignDialogProps) {
  const [name, setName] = useState("");
  const [landingPage, setLandingPage] = useState("");
  const [description, setDescription] = useState("");
  
  const createMutation = useCreateUtmCampaign();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        landingPage: landingPage.trim() || undefined,
      });
      
      toast.success("Campaign created successfully");
      setName("");
      setLandingPage("");
      setDescription("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      setName("");
      setLandingPage("");
      setDescription("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Add a new campaign to your library
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter campaign name"
              className="mt-1"
              disabled={createMutation.isPending}
              maxLength={100}
              required
            />
          </div>

          <div>
            <Label htmlFor="landing-page">Landing Page URL</Label>
            <Input
              id="landing-page"
              value={landingPage}
              onChange={(e) => setLandingPage(e.target.value)}
              placeholder="https://example.com"
              className="mt-1"
              disabled={createMutation.isPending}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Campaign description (optional)"
              className="mt-1"
              rows={3}
              disabled={createMutation.isPending}
              maxLength={500}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
