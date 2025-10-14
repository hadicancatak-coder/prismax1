import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Template {
  id: string;
  name: string;
  description: string | null;
  default_priority: string;
  estimated_hours: number | null;
  entity: string | null;
  is_public: boolean;
  checklist_items: any[];
}

interface TaskTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFromTemplate: (template: Template) => void;
}

export function TaskTemplateDialog({ open, onOpenChange, onCreateFromTemplate }: TaskTemplateDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    default_priority: "Medium",
    estimated_hours: "",
    entity: "",
    is_public: false,
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("task_templates")
      .select("*")
      .order("name");

    if (!error && data) {
      setTemplates(data as Template[]);
    }
    setLoading(false);
  };

  const createTemplate = async () => {
    if (!newTemplate.name) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("task_templates").insert({
      name: newTemplate.name,
      description: newTemplate.description || null,
      default_priority: newTemplate.default_priority as any,
      estimated_hours: newTemplate.estimated_hours ? parseFloat(newTemplate.estimated_hours) : null,
      entity: newTemplate.entity || null,
      is_public: newTemplate.is_public,
      checklist_items: [] as any,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Template created" });
      setShowCreateForm(false);
      setNewTemplate({
        name: "",
        description: "",
        default_priority: "Medium",
        estimated_hours: "",
        entity: "",
        is_public: false,
      });
      fetchTemplates();
    }
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from("task_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Template deleted" });
      fetchTemplates();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Task Templates
          </DialogTitle>
          <DialogDescription>
            Create tasks from pre-configured templates to save time
          </DialogDescription>
        </DialogHeader>

        {!showCreateForm ? (
          <div className="space-y-4">
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              Create New Template
            </Button>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No templates yet. Create your first one!
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{template.name}</h4>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{template.default_priority}</Badge>
                          {template.estimated_hours && (
                            <Badge variant="secondary">{template.estimated_hours}h</Badge>
                          )}
                          {template.entity && (
                            <Badge variant="secondary">{template.entity}</Badge>
                          )}
                          {template.is_public && (
                            <Badge>Public</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            onCreateFromTemplate(template);
                            onOpenChange(false);
                          }}
                        >
                          Use
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="e.g., Social Media Post"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="What is this template for?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Default Priority</Label>
                <Select
                  value={newTemplate.default_priority}
                  onValueChange={(value) =>
                    setNewTemplate({ ...newTemplate, default_priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={newTemplate.estimated_hours}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, estimated_hours: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Entity</Label>
              <Input
                value={newTemplate.entity}
                onChange={(e) => setNewTemplate({ ...newTemplate, entity: e.target.value })}
                placeholder="e.g., Marketing, Development"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={newTemplate.is_public}
                onCheckedChange={(checked) =>
                  setNewTemplate({ ...newTemplate, is_public: checked })
                }
              />
              <Label>Make this template public (visible to all users)</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={createTemplate} className="flex-1">
                Create Template
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
