import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProjectDialog({ open, onOpenChange, onSuccess }: ProjectDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [requiredTime, setRequiredTime] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [relatedTasks, setRelatedTasks] = useState<string[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchTasks();
    }
  }, [open]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .order("name");
    setAllUsers(data || []);
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("id, title")
      .order("created_at", { ascending: false });
    setAllTasks(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: "Error", description: "Project name is required", variant: "destructive" });
      return;
    }

    const { data: project, error } = await supabase.from("projects").insert({
      name: name.trim(),
      description: description.trim(),
      due_date: dueDate?.toISOString(),
      required_time: requiredTime ? parseInt(requiredTime) : null,
      created_by: user?.id,
      members: selectedMembers
    }).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update related tasks with project_id
    if (relatedTasks.length > 0 && project) {
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ project_id: project.id })
        .in("id", relatedTasks);

      if (taskError) {
        console.error("Error updating tasks:", taskError);
      }
    }

    toast({ title: "Success", description: "Project created successfully" });
    resetForm();
    onOpenChange(false);
    onSuccess?.();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDueDate(undefined);
    setRequiredTime("");
    setSelectedMembers([]);
    setRelatedTasks([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Add a new project with team members and tasks</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
              rows={3}
            />
          </div>

          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="requiredTime">Required Time (hours)</Label>
            <Input
              id="requiredTime"
              type="number"
              value={requiredTime}
              onChange={(e) => setRequiredTime(e.target.value)}
              placeholder="Estimated hours"
            />
          </div>

          <div>
            <Label>Team Members</Label>
            <Select onValueChange={(value) => {
              if (!selectedMembers.includes(value)) {
                setSelectedMembers([...selectedMembers, value]);
              }
            }}>
              <SelectTrigger><SelectValue placeholder="Add members" /></SelectTrigger>
              <SelectContent>
                {allUsers.filter(u => u.user_id).map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedMembers.map((id) => {
                  const member = allUsers.find(u => u.user_id === id);
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {member?.name || member?.email}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedMembers(selectedMembers.filter(m => m !== id))} />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label>Related Tasks</Label>
            <Select onValueChange={(value) => {
              if (!relatedTasks.includes(value)) {
                setRelatedTasks([...relatedTasks, value]);
              }
            }}>
              <SelectTrigger><SelectValue placeholder="Link tasks to project" /></SelectTrigger>
              <SelectContent>
                {allTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {relatedTasks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {relatedTasks.map((id) => {
                  const task = allTasks.find(t => t.id === id);
                  return (
                    <Badge key={id} variant="outline" className="flex items-center gap-1">
                      {task?.title}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setRelatedTasks(relatedTasks.filter(t => t !== id))} />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
