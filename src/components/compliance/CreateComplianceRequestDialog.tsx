import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useComplianceRequests } from "@/hooks/useComplianceRequests";
import { AssetUploader } from "./AssetUploader";

interface CreateComplianceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  title: string;
  description: string;
}

interface Asset {
  asset_type: "text" | "image" | "video" | "link";
  asset_content: string;
  asset_metadata?: Record<string, any>;
}

export function CreateComplianceRequestDialog({
  open,
  onOpenChange,
}: CreateComplianceRequestDialogProps) {
  const { register, handleSubmit, reset } = useForm<FormData>();
  const { createRequest } = useComplianceRequests();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FormData) => {
    if (assets.length === 0) {
      alert("Please add at least one asset");
      return;
    }

    setIsSubmitting(true);
    createRequest(
      {
        title: data.title,
        description: data.description,
        assets,
      },
      {
        onSuccess: () => {
          reset();
          setAssets([]);
          onOpenChange(false);
        },
        onSettled: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  const handleAddAsset = (asset: Asset) => {
    setAssets([...assets, asset]);
  };

  const handleRemoveAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Compliance Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="e.g., Summer Campaign 2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe what needs to be reviewed..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Assets ({assets.length})</Label>
            </div>

            {assets.map((asset, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-md bg-muted/50"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium capitalize">
                    {asset.asset_type}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {asset.asset_content.slice(0, 50)}...
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAsset(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <AssetUploader onAssetAdded={handleAddAsset} />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
