import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { VersionComments } from "./VersionComments";
import { useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";
import { useCampaignVersions } from "@/hooks/useCampaignVersions";
import { CampaignComments } from "./CampaignComments";
import { ExternalReviewComments } from "./ExternalReviewComments";
import { Loader2, FileImage, ExternalLink, Save, X, MessageCircle, Plus, Edit, Trash2, Activity, File, Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [versionNotes, setVersionNotes] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isAddingVersion, setIsAddingVersion] = useState(false);
  const [editingInlineVersionId, setEditingInlineVersionId] = useState<string | null>(null);
  const [editVersionNotes, setEditVersionNotes] = useState("");
  const [editVersionImage, setEditVersionImage] = useState<File | null>(null);
  const [editVersionAssetLink, setEditVersionAssetLink] = useState("");
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);

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
      
      return data;
    },
    enabled: open && !!campaignId,
  });

  const updateMutation = useUpdateUtmCampaign();
  const { upsertMetadata, uploadImage } = useCampaignMetadata();
  const { getEntitiesForCampaign } = useCampaignEntityTracking();
  const { useVersions, createVersion, updateVersion, deleteVersion } = useCampaignVersions();
  const { data: versions = [], isLoading: versionsLoading } = useVersions(campaignId);
  
  const entities = getEntitiesForCampaign(campaignId);

  // Reset form when campaign data changes or when toggling edit mode
  const resetFormFields = () => {
    if (campaign) {
      setName(campaign.name || "");
      setLandingPage(campaign.landing_page || "");
      setDescription(campaign.description || "");
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

      setIsEditing(false);
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
        assetLink: "",
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
              <DialogDescription>
                View and manage campaign details, versions, and comments
              </DialogDescription>
            </DialogHeader>
            
            <div className="px-lg pb-sm border-b flex items-center justify-end gap-sm shrink-0">
              <Button
                variant={showComments ? "default" : "outline"}
                size="sm"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="h-4 w-4 mr-sm" />
                Comments
              </Button>
            </div>

            <ScrollArea className="flex-1 px-lg py-md">
              <div className="space-y-md">
                {/* Campaign Info */}
                <Card className="p-md space-y-sm">
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
                      <p className="mt-xs text-body-sm break-all">
                        {campaign.landing_page ? (
                          <a href={campaign.landing_page} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-xs">
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
                    <div className="flex flex-wrap gap-xs mt-sm">
                      {entities.length === 0 ? (
                        <p className="text-body-sm text-muted-foreground">Not live on any entity yet</p>
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
                    </>
                  )}

                </Card>

                {/* Versions Log */}
                <Card className="p-card">
                  <div className="flex items-center justify-between mb-md">
                    <div className="flex items-center gap-sm">
                      <Activity className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-heading-md">Version History</h3>
                    </div>
                    <Button onClick={() => setIsAddingVersion(!isAddingVersion)} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Version
                    </Button>
                  </div>

                  {isAddingVersion && (
                    <Card className="p-md mb-md border-2 border-primary/20 bg-card">
                      <div className="space-y-sm">
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
                          <Label htmlFor="version-image">Attach Asset (Image up to 2MB or Link)</Label>
                          <Input
                            id="version-image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="mt-1 cursor-pointer"
                          />
                        </div>
                        <div className="flex gap-sm justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAddingVersion(false);
                              setVersionNotes("");
                              setImageFile(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleAddVersion} disabled={!versionNotes.trim()}>
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
                    <div className="text-center py-8 text-muted-foreground text-body-sm">
                      No versions yet. Create your first version to track changes.
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="space-y-sm">
                      {versions.map((version) => {
                        const createdDate = version.created_at ? new Date(version.created_at) : null;
                        const isValidDate = createdDate && !isNaN(createdDate.getTime());
                        const isEditing = editingInlineVersionId === version.id;

                        return (
                          <AccordionItem
                            key={version.id}
                            value={version.id}
                            className="border rounded-lg bg-card hover:bg-card-hover transition-smooth"
                          >
                            <AccordionTrigger className="px-md py-sm hover:no-underline">
                              <div className="flex items-center gap-sm flex-1">
                                <Badge variant="outline" className="flex-shrink-0">
                                  v{version.version_number}
                                </Badge>
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-body">{version.name}</div>
                                  {version.version_notes && (
                                    <p className="text-body-sm text-muted-foreground mt-xs line-clamp-1">
                                      {version.version_notes}
                                    </p>
                                  )}
                                </div>
                                <span className="text-body-sm text-muted-foreground whitespace-nowrap">
                                  {isValidDate
                                    ? format(createdDate, 'MMM d, yyyy')
                                    : 'Date unavailable'}
                                </span>
                              </div>
                            </AccordionTrigger>

                            <AccordionContent className="px-md pb-md pt-0">
                              {isEditing ? (
                                // Edit Mode
                                <div className="space-y-sm pt-sm border-t">
                                  <div>
                                    <Label>Version Notes</Label>
                                    <Textarea
                                      value={editVersionNotes}
                                      onChange={(e) => setEditVersionNotes(e.target.value)}
                                      placeholder="Version notes..."
                                      rows={3}
                                      className="mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label>Asset (Image or Link)</Label>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => setEditVersionImage(e.target.files?.[0] || null)}
                                      className="mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label>Asset Link</Label>
                                    <Input
                                      value={editVersionAssetLink}
                                      onChange={(e) => setEditVersionAssetLink(e.target.value)}
                                      placeholder="https://..."
                                      className="mt-1"
                                    />
                                  </div>

                                  <div className="flex gap-sm justify-end pt-sm">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingInlineVersionId(null);
                                        setEditVersionNotes("");
                                        setEditVersionImage(null);
                                        setEditVersionAssetLink("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          let imageUrl = version.image_url;
                                          let imageFileSize = version.image_file_size;

                                          if (editVersionImage) {
                                            const uploadResult = await uploadImage.mutateAsync({
                                              file: editVersionImage,
                                              campaignId,
                                            });
                                            imageUrl = uploadResult.publicUrl;
                                            imageFileSize = editVersionImage.size;
                                          }

                                          await updateVersion.mutateAsync({
                                            versionId: version.id,
                                            versionNotes: editVersionNotes || version.version_notes,
                                            imageUrl,
                                            imageFileSize,
                                            assetLink: editVersionAssetLink || version.asset_link,
                                          });

                                          setEditingInlineVersionId(null);
                                          setEditVersionNotes("");
                                          setEditVersionImage(null);
                                          setEditVersionAssetLink("");
                                        } catch (error) {
                                          toast.error("Failed to update version");
                                        }
                                      }}
                                    >
                                      <Save className="h-4 w-4 mr-2" />
                                      Save Changes
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <div className="space-y-sm pt-sm border-t">
                                  {version.version_notes && (
                                    <div>
                                      <Label className="text-muted-foreground">Notes</Label>
                                      <p className="text-body-sm mt-xs">{version.version_notes}</p>
                                    </div>
                                  )}

                                  {version.image_url && (
                                    <div>
                                      <Label className="text-muted-foreground">Asset</Label>
                                      <img
                                        src={version.image_url}
                                        alt={`Version ${version.version_number}`}
                                        className="mt-xs w-full max-w-md rounded-lg border border-border"
                                      />
                                      {version.image_file_size && (
                                        <p className="text-metadata text-muted-foreground mt-xs">
                                          Size: {(version.image_file_size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {version.asset_link && (
                                    <div>
                                      <Label className="text-muted-foreground">Asset Link</Label>
                                      <a
                                        href={version.asset_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-xs text-body-sm mt-xs"
                                      >
                                        {version.asset_link}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                  )}

                                  <div className="flex gap-sm justify-end pt-sm border-t">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingInlineVersionId(version.id);
                                        setEditVersionNotes(version.version_notes || "");
                                        setEditVersionAssetLink(version.asset_link || "");
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setDeletingVersionId(version.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </Button>
                                  </div>
                      </div>
                    )}
                    
                    {/* Version Comments */}
                    <div className="border-t border-border pt-md space-y-md">
                      <div>
                        <h4 className="font-semibold text-body-sm mb-sm">Internal Comments</h4>
                        <VersionComments
                          versionId={version.id}
                          campaignId={campaign.id}
                        />
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-body-sm mb-sm">External Feedback</h4>
                        <ExternalReviewComments versionId={version.id} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                        );
                      })}
                    </Accordion>
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

      {/* Delete Version Confirmation */}
      <AlertDialog open={!!deletingVersionId} onOpenChange={() => setDeletingVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this version? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deletingVersionId) {
                handleDeleteVersion(deletingVersionId);
                setDeletingVersionId(null);
              }
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Dialog>
  );
}
