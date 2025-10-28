import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateOperationLog } from "@/hooks/useOperationLogs";
import { ENTITIES } from "@/lib/constants";

export function CreateAuditLogDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("");
  const [entity, setEntity] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");

  const createLog = useCreateOperationLog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !platform) return;

    await createLog.mutateAsync({
      title,
      description,
      platform,
      entity,
      deadline: deadline || undefined,
    });

    setOpen(false);
    setTitle("");
    setDescription("");
    setPlatform("");
    setEntity([]);
    setDeadline("");
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overall audit notes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform">Platform *</Label>
              <Select value={platform} onValueChange={setPlatform} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Google">Google Ads</SelectItem>
                  <SelectItem value="SocialUA">SocialUA (Meta)</SelectItem>
                  <SelectItem value="Snap">Snapchat</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="X">X (Twitter)</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="grid grid-cols-3 gap-2 mt-2">
              {ENTITIES.map((ent) => (
                <button
                  key={ent}
                  type="button"
                  onClick={() => handleEntityChange(ent)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
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

          <div className="flex justify-end gap-2 pt-4">
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
