import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useUpdateUtmCampaign } from "@/hooks/useUtmCampaigns";
import { useCampaignMetadata } from "@/hooks/useCampaignMetadata";
import { useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";
import { useCampaignVersions } from "@/hooks/useCampaignVersions";
import { CampaignComments } from "./CampaignComments";
import { Loader2, FileImage, ExternalLink, Save, X, MessageCircle, Plus, MoreVertical, Edit, Trash2, Activity } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [showComments, setShowComments] = useState(false);
  const [isAddingVersion, setIsAddingVersion] = useState(false);
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);

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
  const { useVersions, createVersion, deleteVersion } = useCampaignVersions();
  const { data: versions = [], isLoading: versionsLoading } = useVersions(campaignId);
  
  const entities = getEntitiesForCampaign(campaignId);

  // Reset form when campaign data changes or when toggling edit mode
  const resetFormFields = () => {
    if (campaign) {
      setName(campaign.name || "");
      setLandingPage(campaign.landing_page || "");
      setDescription(campaign.description || "");
      setAssetLink(campaign.campaign_metadata?.asset_link || "");
      setImageFile(null);
    }
  };

  const handleToggleEdit = () => {
    if (!isEditing) {
      // When entering edit mode, reset fields with current data
      resetFormFields();
    }
    setIsEditing(!isEditing);
  };

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
        assetLink: assetLink || undefined,
      });

      setIsEditing(false);
      setImageFile(null);
      toast.success("Campaign updated successfully");
    } catch (error) {
      toast.error("Failed to update campaign");
    }
  };

  const handleAddVersion = async () => {
    if (!versionNotes.trim()) {
      toast.error("Please provide version notes");
      return;
    }

    try {
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
      setIsAddingVersion(false);
      setImageFile(null);
      toast.success("Version saved successfully");
    } catch (error) {
      toast.error("Failed to save version");
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    try {
      await deleteVersion.mutateAsync(versionId);
      toast.success("Version deleted");
    } catch (error) {
      toast.error("Failed to delete version");
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
      <DialogContent 
        className={cn(
          "max-h-[90vh] p-0 gap-0 transition-all duration-300",
          showComments ? "max-w-[1400px]" : "max-w-4xl"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex h-full max-h-[90vh]">
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2 border-b-0 shrink-0">
              <DialogTitle className="text-xl">
                {isEditing ? (
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="font-semibold" />
                ) : (
                  campaign.name
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="px-6 pb-3 border-b flex items-center justify-end gap-2 shrink-0">
              <Button
                variant={showComments ? "default" : "outline"}
                size="sm"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Comments
              </Button>
            </div>

            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {/* Campaign Info */}
                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Campaign Information</h3>
                    {isEditing ? (
                      <Button onClick={handleSave} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    ) : (
                      <Button onClick={handleToggleEdit} size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label>Landing Page</Label>
                    {isEditing ? (
                      <Input
                        value={landingPage}
                        onChange={(e) => setLandingPage(e.target.value)}
                        placeholder="https://example.com"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm break-all">
                        {campaign.landing_page ? (
                          <a href={campaign.landing_page} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            {campaign.landing_page}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
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
                          <Badge key={entityTracking.id} variant="secondary">
                            {entityTracking.entity}
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileImage className="h-4 w-4" />
                              <span>Current image: {(campaign.campaign_metadata.image_file_size || 0) / 1024}KB</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="asset-link">External Asset Link (for files &gt;2MB)</Label>
                        <Input
                          id="asset-link"
                          value={assetLink}
                          onChange={(e) => setAssetLink(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}

                  {!isEditing && campaign.campaign_metadata && (
                    <div>
                      <Label>Assets</Label>
                      <div className="mt-2 space-y-2">
                        {campaign.campaign_metadata.image_url && (
                          <a
                            href={campaign.campaign_metadata.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <FileImage className="h-4 w-4" />
                            View Image ({(campaign.campaign_metadata.image_file_size || 0) / 1024}KB)
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {campaign.campaign_metadata.asset_link && (
                          <a
                            href={campaign.campaign_metadata.asset_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            External Asset Link
                          </a>
                        )}
                        {!campaign.campaign_metadata.image_url && !campaign.campaign_metadata.asset_link && (
                          <p className="text-sm text-muted-foreground">No assets uploaded</p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Versions Log */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Version History</h3>
                    </div>
                    <Button onClick={() => setIsAddingVersion(!isAddingVersion)} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Version
                    </Button>
                  </div>

                  {isAddingVersion && (
                    <Card className="p-4 mb-4 border-2 border-primary/20">
                      <div className="space-y-3">
                        <div>
                          <Label>Version Notes *</Label>
                          <Textarea
                            value={versionNotes}
                            onChange={(e) => setVersionNotes(e.target.value)}
                            placeholder="Describe what changed in this version..."
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="version-image">Attach Asset (optional)</Label>
                          <Input id="version-image" type="file" accept="image/*" onChange={handleImageUpload} className="mt-1 cursor-pointer" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => {
                            setIsAddingVersion(false);
                            setVersionNotes("");
                            setImageFile(null);
                          }}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleAddVersion}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Version
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {versionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No versions yet. Create your first version to track changes.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {versions.map((version, index) => {
                        const createdDate = version.created_at ? new Date(version.created_at) : null;
                        const isValidDate = createdDate && !isNaN(createdDate.getTime());
                        
                        return (
                          <div
                            key={version.id}
                            className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Badge variant="outline" className="flex-shrink-0">v{version.version_number}</Badge>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{version.name}</div>
                                  {version.version_notes && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {version.version_notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {isValidDate 
                                    ? format(createdDate, 'MMM d, yyyy')
                                    : 'Date unavailable'}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingVersionId(version.id)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteVersion(version.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            </ScrollArea>
          </div>

          {/* Expandable Comments Section */}
          {showComments && (
            <>
              <Separator orientation="vertical" className="h-full" />
              <div className="w-[500px] flex flex-col">
                <div className="px-4 py-3 border-b shrink-0">
                  <h3 className="font-semibold text-sm">Comments & Activity</h3>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CampaignComments campaignId={campaignId} />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
