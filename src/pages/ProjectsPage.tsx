import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Edit, Trash2, Users } from "lucide-react";
import { format } from "date-fns";

export default function ProjectsPage() {
  const { user, userRole } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [timelines, setTimelines] = useState<{ [key: string]: any[] }>({});
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Project form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Timeline form
  const [phaseName, setPhaseName] = useState("");
  const [phaseStart, setPhaseStart] = useState("");
  const [phaseEnd, setPhaseEnd] = useState("");
  const [phaseDescription, setPhaseDescription] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchUsers();

    const channel = supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchProjects())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_timelines' }, () => fetchProjects())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .order("name");
    setAllUsers(data || []);
  };

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProjects(data || []);
      // Fetch timelines for each project
      for (const project of data || []) {
        fetchTimelines(project.id);
      }
    }
    setLoading(false);
  };

  const fetchTimelines = async (projectId: string) => {
    const { data } = await supabase
      .from("project_timelines")
      .select("*")
      .eq("project_id", projectId)
      .order("start_date", { ascending: true });

    setTimelines(prev => ({ ...prev, [projectId]: data || [] }));
  };

  const handleCreateProject = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Project name is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("projects").insert({
      name: name.trim(),
      description: description.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      created_by: user?.id,
      members: selectedMembers
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Project created successfully" });
      setDialogOpen(false);
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setSelectedMembers([]);
      await fetchProjects();
    }
  };

  const handleDeleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Project deleted" });
      await fetchProjects();
    }
  };

  const handleAddTimeline = async () => {
    if (!selectedProject || !phaseName.trim() || !phaseStart || !phaseEnd) {
      toast({ title: "Error", description: "All timeline fields are required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("project_timelines").insert({
      project_id: selectedProject,
      phase_name: phaseName.trim(),
      start_date: phaseStart,
      end_date: phaseEnd,
      description: phaseDescription.trim()
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Timeline phase added" });
      setTimelineDialogOpen(false);
      setPhaseName("");
      setPhaseStart("");
      setPhaseEnd("");
      setPhaseDescription("");
      await fetchProjects();
    }
  };

  if (loading) return <div className="p-8">Loading projects...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        {userRole === "admin" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />New Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a new project with timelines and planning</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Project Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter project name" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project description" />
                </div>
                <div>
                  <Label>Project Members</Label>
                  <Select 
                    onValueChange={(value) => {
                      if (!selectedMembers.includes(value)) {
                        setSelectedMembers([...selectedMembers, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add team members" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers
                        .filter(u => u.user_id && u.user_id.trim() !== '')
                        .map((u) => (
                          <SelectItem key={u.user_id} value={u.user_id}>
                            {u.name || u.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedMembers.map((memberId) => {
                        const member = allUsers.find(u => u.user_id === memberId);
                        return (
                          <div key={memberId} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                            <Users className="h-3 w-3" />
                            {member?.name || member?.email}
                            <button
                              onClick={() => setSelectedMembers(selectedMembers.filter(id => id !== memberId))}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleCreateProject} className="w-full">Create Project</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                  {project.start_date && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(project.start_date), "MMM dd, yyyy")} - {project.end_date ? format(new Date(project.end_date), "MMM dd, yyyy") : "Ongoing"}
                    </div>
                  )}
                  {project.members && project.members.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Team Members
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.members.map((memberId: string) => {
                          const member = allUsers.find(u => u.user_id === memberId);
                          return (
                            <div key={memberId} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                              {member?.name || member?.email || 'Unknown'}
                              {userRole === "admin" && (
                                <button
                                  onClick={async () => {
                                    const newMembers = project.members.filter((id: string) => id !== memberId);
                                    const { error } = await supabase
                                      .from("projects")
                                      .update({ members: newMembers })
                                      .eq("id", project.id);
                                    if (error) {
                                      toast({ title: "Error", description: error.message, variant: "destructive" });
                                    } else {
                                      toast({ title: "Success", description: "Member removed" });
                                      await fetchProjects();
                                    }
                                  }}
                                  className="ml-1 text-muted-foreground hover:text-destructive"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {userRole === "admin" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProject(project.id);
                        setTimelineDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteProject(project.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-3">Timeline</h3>
              {timelines[project.id]?.length > 0 ? (
                <div className="space-y-2">
                  {timelines[project.id].map((phase) => (
                    <div key={phase.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{phase.phase_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(phase.start_date), "MMM dd")} - {format(new Date(phase.end_date), "MMM dd, yyyy")}
                        </span>
                      </div>
                      {phase.description && <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No timeline phases added yet</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={timelineDialogOpen} onOpenChange={setTimelineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Timeline Phase</DialogTitle>
            <DialogDescription>Add a new phase to the project timeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Phase Name</Label>
              <Input value={phaseName} onChange={(e) => setPhaseName(e.target.value)} placeholder="e.g., Planning, Development" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={phaseStart} onChange={(e) => setPhaseStart(e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={phaseEnd} onChange={(e) => setPhaseEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={phaseDescription} onChange={(e) => setPhaseDescription(e.target.value)} placeholder="Phase description" />
            </div>
            <Button onClick={handleAddTimeline} className="w-full">Add Phase</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}