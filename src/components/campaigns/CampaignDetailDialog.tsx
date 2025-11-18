import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCampaignMetadata } from "@/hooks/useCampaignMetadata";
import { useCampaignComments } from "@/hooks/useCampaignComments";
import { format } from "date-fns";
import { Loader2, Upload, X } from "lucide-react";

interface CampaignDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: {
    id: string;
    name: string;
    landing_page?: string | null;
  };
  trackingId?: string | null; // If opened from a specific entity assignment
}

export function CampaignDetailDialog({
  open,
  onOpenChange,
  campaign,
  trackingId,
}: CampaignDetailDialogProps) {
  const { useMetadata, upsertMetadata, uploadImage } = useCampaignMetadata();
  const { data: metadata } = useMetadata(campaign.id);
  const { useComments, addComment } = useCampaignComments();
  const { data: comments = [] } = useComments(trackingId || "");
  
  const [lpLink, setLpLink] = useState(campaign.landing_page || "");
  const [versionCode, setVersionCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (metadata) {
      setVersionCode(metadata.version_code || "");
      setImageUrl(metadata.image_url || "");
    }
  }, [metadata]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB. Please use an image URL instead.");
      setShowUrlFallback(true);
      return;
    }

    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setShowUrlFallback(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalImageUrl = imageUrl;
      let fileSize = metadata?.image_file_size;

      // Upload image if new file selected
      if (imageFile) {
        const result = await uploadImage.mutateAsync({
          file: imageFile,
          campaignId: campaign.id,
        });
        finalImageUrl = result.publicUrl;
        fileSize = result.fileSize;
      }

      // Save metadata
      await upsertMetadata.mutateAsync({
        campaignId: campaign.id,
        versionCode,
        imageUrl: finalImageUrl,
        imageFileSize: fileSize,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !trackingId) return;

    try {
      await addComment.mutateAsync({
        trackingId,
        commentText: newComment,
      });
      setNewComment("");
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <DialogDescription>Manage campaign details and metadata</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* LP Link */}
          <div className="space-y-2">
            <Label htmlFor="lp-link">Landing Page URL</Label>
            <Input
              id="lp-link"
              value={lpLink}
              onChange={(e) => setLpLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Campaign Image</Label>
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Campaign"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageUrl("");
                    setImageFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload image
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Max 2MB</p>
                </label>
              </div>
            )}
            {showUrlFallback && (
              <div className="mt-2">
                <Input
                  placeholder="Or paste image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Version Code */}
          <div className="space-y-2">
            <Label htmlFor="version">Version Code</Label>
            <Input
              id="version"
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              placeholder="e.g., v2.3, v1.0"
            />
          </div>

          {/* Comments Section */}
          {trackingId && (
            <div className="space-y-2">
              <Label>Comments</Label>
              <ScrollArea className="h-48 border rounded-lg p-3 bg-muted/30">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="mb-4 last:mb-0">
                      <div className="flex items-start gap-2 mb-1">
                        <p className="text-xs text-muted-foreground flex-1">
                          {comment.author_name} •{" "}
                          {format(new Date(comment.created_at), "MMM d, h:mm a")}
                        </p>
                        {comment.is_external && (
                          <Badge variant="outline" className="text-xs">
                            External
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{comment.comment_text}</p>
                    </div>
                  ))
                )}
              </ScrollArea>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
