import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users } from "lucide-react";
import { useCreateOperationLog, useDefaultAssignees } from "@/hooks/useOperationLogs";
import { ENTITIES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

export function CreateAuditLogDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("");
  const [entity, setEntity] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");

  const createLog = useCreateOperationLog();
  const { data: assigneeData } = useDefaultAssignees(platform);

  const ppcPlatforms = ["Google", "Search", "DGen", "PMax", "Display", "GDN", "YouTube"];
  const socialPlatforms = ["Meta", "Facebook", "Instagram", "X", "TikTok", "Snap", "Reddit"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !platform) return;

    try {
      await createLog.mutateAsync({
        title,
        description,
        platform,
        entity,
        deadline: deadline ? new Date(deadline + 'T00:00:00Z').toISOString() : undefined,
      });

      setOpen(false);
      setTitle("");
      setDescription("");
      setPlatform("");
      setEntity([]);
      setDeadline("");
    } catch (error) {
      // Error is already handled by the mutation's onError callback
      console.error('Failed to create audit log:', error);
    }
  };

  const handleEntityChange = (value: string) => {
    if (entity.includes(value)) {
      setEntity(entity.filter(e => e !== value));
    } else {
      setEntity([...entity, value]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Audit Log
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Operations Audit Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-md">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Google Ads Q1 Audit - Saudi Arabia"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Overall audit notes..."
              minHeight="80px"
            />
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div>
              <Label htmlFor="platform">Platform *</Label>
              <Select value={platform} onValueChange={setPlatform} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-sm py-1.5 text-body-sm font-semibold text-muted-foreground">
                    PPC Team
                  </div>
                  {ppcPlatforms.map((p) => (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-sm">
                        <Badge variant="outline" className="bg-info-soft text-info-text border-info/30">
                          PPC
                        </Badge>
                        {p}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-sm py-1.5 text-body-sm font-semibold text-muted-foreground mt-sm">
                    SocialUA Team
                  </div>
                  {socialPlatforms.map((p) => (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-sm">
                        <Badge variant="outline" className="bg-purple-soft text-purple-text border-purple/30">
                          Social
                        </Badge>
                        {p}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {assigneeData && assigneeData.assignees.length > 0 && (
                <div className="mt-sm p-sm bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-sm text-body-sm font-medium mb-sm">
                    <Users className="h-4 w-4" />
                    Auto-assigned to {assigneeData.teamName} Team:
                  </div>
                  <div className="flex flex-wrap gap-sm">
                    {assigneeData.assignees.map((assignee: any) => (
                      <div key={assignee.id} className="flex items-center gap-1.5 bg-background px-sm py-xs rounded-md border">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={assignee.avatar_url} />
                          <AvatarFallback className="text-metadata">
                            {assignee.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-metadata">{assignee.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Entities/Countries</Label>
            <div className="grid grid-cols-3 gap-sm mt-sm">
              {ENTITIES.map((ent) => (
                <button
                  key={ent}
                  type="button"
                  onClick={() => handleEntityChange(ent)}
                  className={`px-sm py-sm rounded-md text-body-sm transition-colors ${
                    entity.includes(ent)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {ent}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-sm pt-md">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLog.isPending}>
              {createLog.isPending ? "Creating..." : "Create Audit Log"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
