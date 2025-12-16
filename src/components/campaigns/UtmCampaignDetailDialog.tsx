import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Loader2, ExternalLink, Save, Edit, MessageCircle, Plus, Trash2, FileImage, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";

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
  const [showComments, setShowComments] = useState(false);
  const [isAddingVersion, setIsAddingVersion] = useState(false);
  const [versionNotes, setVersionNotes] = useState("");
  const [versionAssetLink, setVersionAssetLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["utm-campaign", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_campaigns")
        .select(`*, campaign_metadata (image_url, asset_link, version_code)`)
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
  const { uploadImage } = useCampaignMetadata();
  const { getEntitiesForCampaign } = useCampaignEntityTracking();
  const { useVersions, createVersion, deleteVersion } = useCampaignVersions();
  const { data: versions = [], isLoading: versionsLoading } = useVersions(campaignId);
  
  const entities = getEntitiesForCampaign(campaignId);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: campaignId,
        name,
        landing_page: landingPage || null,
      });
      setIsEditing(false);
      toast.success("Campaign updated");
    } catch {
      toast.error("Failed to update campaign");
    }
  };

  const handleAddVersion = async () => {
    if (!versionNotes.trim()) {
      toast.error("Please provide version notes");
      return;
    }

    try {
      let imageUrl: string | undefined;
      let imageFileSize: number | undefined;

      if (imageFile) {
        const result = await uploadImage.mutateAsync({ campaignId, file: imageFile });
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
        assetLink: versionAssetLink || undefined,
        versionNotes,
      });

      setVersionNotes("");
      setVersionAssetLink("");
      setImageFile(null);
      setIsAddingVersion(false);
      toast.success("Version saved");
    } catch {
      toast.error("Failed to save version");
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    try {
      await deleteVersion.mutateAsync(versionId);
      toast.success("Version deleted");
      setDeletingVersionId(null);
    } catch {
      toast.error("Failed to delete version");
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[90vh] p-0 gap-0 transition-all duration-300",
        showComments ? "max-w-[1200px]" : "max-w-3xl"
      )}>
        <div className="flex h-full max-h-[90vh]">
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="text-xl font-semibold mb-2" 
                    />
                  ) : (
                    <DialogTitle className="text-xl">{campaign.name}</DialogTitle>
                  )}
                  {isEditing ? (
                    <Input 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Short description..."
                      className="text-sm text-muted-foreground"
                    />
                  ) : (
                    <DialogDescription className="mt-1">
                      {campaign.description || "No description"}
                    </DialogDescription>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant={showComments ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Comments
                  </Button>
                  {isEditing ? (
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6 pb-6">
              <div className="space-y-6">
                {/* Campaign Info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Landing Page</Label>
                    {isEditing ? (
                      <Input
                        value={landingPage}
                        onChange={(e) => setLandingPage(e.target.value)}
                        placeholder="https://example.com"
                        className="mt-1"
                      />
                    ) : campaign.landing_page ? (
                      <a 
                        href={campaign.landing_page} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline flex items-center gap-1 mt-1 break-all"
                      >
                        {campaign.landing_page}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground text-sm mt-1">Not set</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm">Active Entities</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {entities.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Not live on any entity</p>
                      ) : (
                        entities.map((e) => (
                          <Badge key={e.id} variant="secondary">{e.entity}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Version History */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Version History</h3>
                    <Button size="sm" variant="outline" onClick={() => setIsAddingVersion(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Version
                    </Button>
                  </div>

                  {isAddingVersion && (
                    <Card className="p-4 mb-4 border-primary/20">
                      <div className="space-y-3">
                        <div>
                          <Label>Version Notes *</Label>
                          <Textarea
                            value={versionNotes}
                            onChange={(e) => setVersionNotes(e.target.value)}
                            placeholder="Describe what changed..."
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Asset Link</Label>
                          <Input
                            value={versionAssetLink}
                            onChange={(e) => setVersionAssetLink(e.target.value)}
                            placeholder="https://..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Image (max 2MB)</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setIsAddingVersion(false);
                            setVersionNotes("");
                            setVersionAssetLink("");
                            setImageFile(null);
                          }}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleAddVersion} disabled={!versionNotes.trim()}>
                            Save Version
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {versionsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : versions.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      No versions yet
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Version</TableHead>
                          <TableHead className="w-28">Date</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="w-20">Asset</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {versions.map((version) => (
                          <TableRow key={version.id}>
                            <TableCell>
                              <Badge variant="outline">v{version.version_number}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {version.created_at ? format(new Date(version.created_at), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {version.version_notes || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {version.image_url && (
                                  <a href={version.image_url} target="_blank" rel="noopener noreferrer">
                                    <FileImage className="h-4 w-4 text-primary hover:text-primary/80" />
                                  </a>
                                )}
                                {version.asset_link && (
                                  <a href={version.asset_link} target="_blank" rel="noopener noreferrer">
                                    <Link2 className="h-4 w-4 text-primary hover:text-primary/80" />
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setDeletingVersionId(version.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Comments Panel */}
          {showComments && (
            <>
              <Separator orientation="vertical" className="h-full" />
              <div className="w-[400px] flex flex-col">
                <div className="px-4 py-3 border-b shrink-0">
                  <h3 className="font-semibold text-sm">Comments</h3>
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
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingVersionId && handleDeleteVersion(deletingVersionId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
