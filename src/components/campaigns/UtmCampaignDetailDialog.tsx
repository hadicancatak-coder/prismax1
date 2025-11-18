import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useUpdateUtmCampaign } from "@/hooks/useUtmCampaigns";
import { useCampaignMetadata } from "@/hooks/useCampaignMetadata";
import { useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";
import { useCampaignVersions } from "@/hooks/useCampaignVersions";
import { CampaignComments } from "./CampaignComments";
import { CampaignVersionHistory } from "./CampaignVersionHistory";
import { Loader2, FileImage, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [assetLink, setAssetLink] = useState("");
  const [versionNotes, setVersionNotes] = useState("");

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["utm-campaign", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_campaigns")
        .select(`
          *,
          campaign_metadata (
            image_url,
            image_file_size,
            version_code,
            asset_link
          )
        `)
        .eq("id", campaignId)
        .single();

      if (error) throw error;
      
      setName(data.name || "");
      setLandingPage(data.landing_page || "");
      setDescription(data.description || "");
      setAssetLink(data.campaign_metadata?.asset_link || "");
      
      return data;
    },
    enabled: open && !!campaignId,
  });

  const updateMutation = useUpdateUtmCampaign();
  const { upsertMetadata, uploadImage } = useCampaignMetadata();
  const { getEntitiesForCampaign } = useCampaignEntityTracking();
  const { createVersion } = useCampaignVersions();
  
  const entities = getEntitiesForCampaign(campaignId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large. Please provide an external link for files over 2MB.");
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      e.target.value = "";
      return;
    }

    setImageFile(file);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: campaignId,
        name,
        landing_page: landingPage || null,
      });

      let imageUrl = campaign?.campaign_metadata?.image_url;
      let imageFileSize = campaign?.campaign_metadata?.image_file_size;

      if (imageFile) {
        const result = await uploadImage.mutateAsync({ 
          campaignId, 
          file: imageFile 
        });
        imageUrl = result.publicUrl;
        imageFileSize = result.fileSize;
      }

      await upsertMetadata.mutateAsync({
        campaignId,
        imageUrl,
        imageFileSize,
        assetLink: assetLink || null,
      });

      if (versionNotes.trim()) {
        await createVersion.mutateAsync({
          campaignId,
          name,
          landingPage: landingPage || undefined,
          description: description || undefined,
          imageUrl,
          imageFileSize,
          assetLink: assetLink || undefined,
          versionNotes,
        });
        setVersionNotes("");
      }

      setIsEditing(false);
      setImageFile(null);
      toast.success("Campaign updated successfully");
    } catch (error) {
      toast.error("Failed to update campaign");
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
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
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Details: {campaign.name}</DialogTitle>
          <DialogDescription>
            Manage campaign information, assets, comments, and version history
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              {isEditing ? (
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
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

            <div>
              <Label>Active Entities</Label>
              <div className="flex flex-wrap gap-1 mt-2">
                {entities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Not live on any entity yet</p>
                ) : (
                  entities.map((entityTracking) => (
                    <Badge key={entityTracking.id} variant="secondary" className="gap-1">
                      {entityTracking.entity}
                      <span className="text-xs">({entityTracking.status})</span>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {isEditing && (
              <>
                <div>
                  <Label htmlFor="asset-image">Campaign Asset (Image, max 2MB)</Label>
                  <div className="mt-1 space-y-2">
                    <Input id="asset-image" type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" />
                    {campaign.campaign_metadata?.image_url && !imageFile && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileImage className="h-4 w-4" />
                        <a href={campaign.campaign_metadata.image_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Current image
                        </a>
                      </div>
                    )}
                    {imageFile && <p className="text-sm text-muted-foreground">Selected: {imageFile.name}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="asset-link">Or External Asset Link (for files over 2MB)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="asset-link"
                      value={assetLink}
                      onChange={(e) => setAssetLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                    />
                    {assetLink && (
                      <Button variant="outline" size="icon" onClick={() => window.open(assetLink, "_blank")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="version-notes">Version Notes (optional)</Label>
                  <Textarea
                    id="version-notes"
                    value={versionNotes}
                    onChange={(e) => setVersionNotes(e.target.value)}
                    placeholder="Describe the changes you're making..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </>
            )}

            {!isEditing && campaign.campaign_metadata && (
              <div className="space-y-2">
                {campaign.campaign_metadata.image_url && (
                  <div>
                    <Label>Campaign Asset</Label>
                    <a href={campaign.campaign_metadata.image_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline mt-1">
                      <FileImage className="h-4 w-4" />
                      View Image ({(campaign.campaign_metadata.image_file_size! / 1024).toFixed(0)} KB)
                    </a>
                  </div>
                )}
                {campaign.campaign_metadata.asset_link && (
                  <div>
                    <Label>External Asset Link</Label>
                    <a href={campaign.campaign_metadata.asset_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline mt-1">
                      <ExternalLink className="h-4 w-4" />
                      Open Link
                    </a>
                  </div>
                )}
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

            <div className="flex justify-end gap-2 pt-4 border-t">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending || upsertMetadata.isPending}>
                    {(updateMutation.isPending || upsertMetadata.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Campaign</Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CampaignComments campaignId={campaignId} />
          </TabsContent>

          <TabsContent value="versions" className="mt-4">
            <CampaignVersionHistory campaignId={campaignId} />
          </TabsContent>

          <TabsContent value="entities" className="space-y-4 mt-4">
            <div>
              <Label>Associated Entities</Label>
              {entities.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No entities associated with this campaign yet.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {entities.map((tracking) => (
                    <Badge key={tracking.id} variant="secondary">{tracking.entity}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Campaign Status by Entity</Label>
              <div className="mt-2 space-y-2">
                {entities.map((tracking) => (
                  <div key={tracking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{tracking.entity}</p>
                      {tracking.notes && <p className="text-sm text-muted-foreground mt-1">{tracking.notes}</p>}
                    </div>
                    <Badge variant={
                      tracking.status === 'active' ? 'success' :
                      tracking.status === 'planning' ? 'secondary' :
                      tracking.status === 'completed' ? 'default' : 'outline'
                    }>
                      {tracking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
