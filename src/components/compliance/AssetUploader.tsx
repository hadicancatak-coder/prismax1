import { useState } from "react";
import { Upload, Link, Type, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useComplianceRequests } from "@/hooks/useComplianceRequests";
import { toast } from "sonner";

interface AssetUploaderProps {
  onAssetAdded: (asset: {
    asset_type: "text" | "image" | "video" | "link";
    asset_content: string;
    asset_metadata?: Record<string, any>;
  }) => void;
  requestId?: string;
}

export function AssetUploader({ onAssetAdded, requestId }: AssetUploaderProps) {
  const [open, setOpen] = useState(false);
  const [assetType, setAssetType] = useState<"text" | "image" | "video" | "link">("text");
  const [textContent, setTextContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { uploadAsset } = useComplianceRequests();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !requestId) return;

    setIsUploading(true);
    try {
      const url = await uploadAsset(file, requestId);
      onAssetAdded({
        asset_type: assetType,
        asset_content: url,
        asset_metadata: {
          filename: file.name,
          size: file.size,
          type: file.type,
        },
      });
      toast.success("File uploaded successfully");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAsset = () => {
    if (assetType === "text" && textContent.trim()) {
      onAssetAdded({
        asset_type: "text",
        asset_content: textContent,
      });
      setTextContent("");
      setOpen(false);
    } else if (assetType === "link" && linkUrl.trim()) {
      onAssetAdded({
        asset_type: "link",
        asset_content: linkUrl,
      });
      setLinkUrl("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Asset Type</Label>
            <Select
              value={assetType}
              onValueChange={(value: any) => setAssetType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Text Content
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Image
                  </div>
                </SelectItem>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video
                  </div>
                </SelectItem>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    External Link
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assetType === "text" && (
            <div className="space-y-2">
              <Label>Text Content</Label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter your text content here..."
                rows={6}
              />
            </div>
          )}

          {assetType === "link" && (
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
          )}

          {(assetType === "image" || assetType === "video") && (
            <div className="space-y-2">
              <Label>Upload File</Label>
              <Input
                type="file"
                accept={
                  assetType === "image"
                    ? "image/*"
                    : "video/*"
                }
                onChange={handleFileUpload}
                disabled={isUploading || !requestId}
              />
              {!requestId && (
                <p className="text-xs text-muted-foreground">
                  Save the request first to upload files
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            {assetType === "text" || assetType === "link" ? (
              <Button type="button" onClick={handleAddAsset}>
                Add
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
