import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Edit } from "lucide-react";
import { format } from "date-fns";
import { useUpdateAuditLog } from "@/hooks/useOperationLogs";
import { Badge } from "@/components/ui/badge";
import { ENTITIES } from "@/lib/constants";

const ppcPlatforms = ["Google", "Search", "DGen", "PMax", "Display", "GDN", "YouTube"];
const socialPlatforms = ["Meta", "Facebook", "Instagram", "X", "TikTok", "Snap", "Reddit"];

const entities = ENTITIES.filter(e => e !== "Global Management");

interface EditAuditLogDialogProps {
  log: any;
}

export function EditAuditLogDialog({ log }: EditAuditLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(log.title);
  const [description, setDescription] = useState(log.description || "");
  const [platform, setPlatform] = useState(log.platform);
  const [entity, setEntity] = useState<string[]>(log.entity || []);
  const [deadline, setDeadline] = useState<Date | undefined>(
    log.deadline ? new Date(log.deadline) : undefined
  );

  const updateLog = useUpdateAuditLog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateLog.mutateAsync({
      id: log.id,
      updates: {
        title,
        description,
        platform,
        entity,
        deadline: deadline?.toISOString(),
      },
    });

    setOpen(false);
  };

  const handleEntityChange = (entityName: string) => {
    setEntity(prev =>
      prev.includes(entityName)
        ? prev.filter(e => e !== entityName)
        : [...prev, entityName]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4 mr-sm" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Audit Log</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-md">
          <div className="space-y-sm">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Google Ads Q1 Audit - Saudi Arabia"
              required
            />
          </div>

          <div className="space-y-sm">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Detailed audit notes..."
              minHeight="120px"
            />
          </div>

          <div className="space-y-sm">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
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
          </div>

          <div className="space-y-sm">
            <Label>Entity/Country</Label>
            <div className="flex flex-wrap gap-sm">
              {entities.map((e) => (
                <Button
                  key={e}
                  type="button"
                  variant={entity.includes(e) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEntityChange(e)}
                >
                  {e}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-sm">
            <Label>Deadline (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-sm h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-sm pt-md">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateLog.isPending}>
              {updateLog.isPending ? "Updating..." : "Update Audit Log"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
