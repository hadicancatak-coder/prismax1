import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateStatusLog, useUpdateStatusLog } from "@/hooks/useStatusLogs";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { StatusLog } from "@/lib/statusLogService";
import { EnhancedMultiSelect } from "@/components/utm/EnhancedMultiSelect";

interface CreateStatusLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLog?: StatusLog | null;
}

export function CreateStatusLogDialog({ open, onOpenChange, editingLog }: CreateStatusLogDialogProps) {
  const [title, setTitle] = useState(editingLog?.title || "");
  const [description, setDescription] = useState(editingLog?.description || "");
  const [logType, setLogType] = useState(editingLog?.log_type || "issue");
  const [entity, setEntity] = useState<string[]>(editingLog?.entity || []);
  const [platform, setPlatform] = useState(editingLog?.platform || "");
  const [campaignName, setCampaignName] = useState(editingLog?.campaign_name || "");

  const { data: entities = [] } = useSystemEntities();
  const { data: platforms = [] } = useUtmPlatforms();
  const { data: campaigns = [] } = useUtmCampaigns();

  const createMutation = useCreateStatusLog();
  const updateMutation = useUpdateStatusLog();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const logData = {
      title,
      description: description || undefined,
      log_type: logType as 'issue' | 'blocker' | 'plan' | 'update' | 'note',
      entity: entity.length > 0 ? entity : undefined,
      platform: platform || undefined,
      campaign_name: campaignName || undefined,
      status: 'active' as const,
    };

    if (editingLog) {
      updateMutation.mutate(
        { id: editingLog.id, updates: logData },
        {
          onSuccess: () => {
            onOpenChange(false);
            resetForm();
          },
        }
      );
    } else {
      createMutation.mutate(logData, {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLogType("issue");
    setEntity([]);
    setPlatform("");
    setCampaignName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingLog ? "Edit Status Log" : "Create Status Log"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter log title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="log-type">Log Type *</Label>
              <Select value={logType} onValueChange={(value) => setLogType(value as any)}>
                <SelectTrigger id="log-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="blocker">Blocker</SelectItem>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Entity</Label>
            <EnhancedMultiSelect
              options={entities.map(e => ({ value: e.name, label: e.name }))}
              selected={entity}
              onChange={setEntity}
              placeholder="Select entities"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign</Label>
            <Select value={campaignName} onValueChange={setCampaignName}>
              <SelectTrigger id="campaign">
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingLog ? "Update" : "Create"} Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
