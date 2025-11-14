import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
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
  const [socialuaUpdate, setSocialuaUpdate] = useState(editingLog?.socialua_update || "");
  const [ppcUpdate, setPpcUpdate] = useState(editingLog?.ppc_update || "");

  const { data: entities = [] } = useSystemEntities();
  const { data: platforms = [] } = useUtmPlatforms();
  const { data: campaigns = [] } = useUtmCampaigns();

  const createMutation = useCreateStatusLog();
  const updateMutation = useUpdateStatusLog();

  // Update form when editingLog changes
  useEffect(() => {
    if (editingLog) {
      setTitle(editingLog.title);
      setDescription(editingLog.description || "");
      setLogType(editingLog.log_type);
      setEntity(editingLog.entity || []);
      setPlatform(editingLog.platform || "");
      setCampaignName(editingLog.campaign_name || "");
      setSocialuaUpdate(editingLog.socialua_update || "");
      setPpcUpdate(editingLog.ppc_update || "");
    } else {
      resetForm();
    }
  }, [editingLog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const logData = {
      title,
      description: description || undefined,
      log_type: logType as 'issue' | 'blocker' | 'plan' | 'update' | 'note' | 'brief',
      entity: entity.length > 0 ? entity : undefined,
      platform: platform || undefined,
      campaign_name: campaignName || undefined,
      socialua_update: logType === 'brief' ? (socialuaUpdate || undefined) : undefined,
      ppc_update: logType === 'brief' ? (ppcUpdate || undefined) : undefined,
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
    setSocialuaUpdate("");
    setPpcUpdate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingLog ? "Edit Status Log" : "Create Status Log"}</DialogTitle>
          <DialogDescription>
            {editingLog ? "Update the status log details below." : "Create a new status log entry."}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <form onSubmit={handleSubmit} className="space-y-4" id="status-log-form">
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
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Enter detailed description"
              minHeight="120px"
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
                  <SelectItem value="brief">Brief</SelectItem>
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

          {logType === 'brief' && (
            <>
              <div className="space-y-2">
                <Label>Social UA Update</Label>
                <RichTextEditor
                  value={socialuaUpdate}
                  onChange={setSocialuaUpdate}
                  placeholder="Enter Social UA updates..."
                  minHeight="120px"
                />
              </div>

              <div className="space-y-2">
                <Label>PPC Update</Label>
                <RichTextEditor
                  value={ppcUpdate}
                  onChange={setPpcUpdate}
                  placeholder="Enter PPC updates..."
                  minHeight="120px"
                />
              </div>
            </>
          )}
          </form>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="status-log-form" disabled={createMutation.isPending || updateMutation.isPending}>
            {editingLog ? "Update" : "Create"} Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
