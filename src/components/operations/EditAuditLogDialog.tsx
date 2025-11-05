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

const ppcPlatforms = ["Google", "Search", "DGen", "PMax", "Display", "GDN", "YouTube"];
const socialPlatforms = ["Meta", "Facebook", "Instagram", "X", "TikTok", "Snap", "Reddit"];

const entities = [
  "Saudi Arabia",
  "UAE",
  "Bahrain",
  "Jordan",
  "Qatar",
  "Kuwait",
  "Oman",
];

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
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Audit Log</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Google Ads Q1 Audit - Saudi Arabia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Detailed audit notes..."
              minHeight="120px"
            />
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  PPC Team
                </div>
                {ppcPlatforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                        PPC
                      </Badge>
                      {p}
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground mt-2">
                  SocialUA Team
                </div>
                {socialPlatforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">
                        Social
                      </Badge>
                      {p}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Entity/Country</Label>
            <div className="flex flex-wrap gap-2">
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

          <div className="space-y-2">
            <Label>Deadline (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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

          <div className="flex justify-end gap-2 pt-4">
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
