import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, ExternalLink, Trash2, Calendar, Users, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { BlockerDialog } from "@/components/BlockerDialog";
import { ProjectDialog } from "@/components/ProjectDialog";
import { ReportDialog } from "@/components/ReportDialog";
import Team from "./Team";

export default function TeamBase() {
  const { user, userRole } = useAuth();
  
  // Blockers state
  const [blockers, setBlockers] = useState<any[]>([]);
  
  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [timelines, setTimelines] = useState<{ [key: string]: any[] }>({});
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false);
  
  // Project form
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Timeline form
  const [phaseName, setPhaseName] = useState("");
  const [phaseStart, setPhaseStart] = useState("");
  const [phaseEnd, setPhaseEnd] = useState("");
  const [phaseDescription, setPhaseDescription] = useState("");
  

  useEffect(() => {
    if (!user) return;
    
    fetchAllData();
    fetchUsers();

    const channel = supabase
      .channel("team-base-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "blockers" }, fetchBlockers)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, fetchProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_timelines" }, fetchProjects)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetchReports)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAllData = async () => {
    await Promise.all([fetchBlockers(), fetchProjects(), fetchReports()]);
  };

  const fetchBlockers = async () => {
    const { data } = await supabase
      .from("blockers")
      .select(`
        *,
        task:task_id(id, title, assignee:assignee_id(name)),
        creator:created_by(name)
      `)
      .order("created_at", { ascending: false });
    setBlockers(data || []);
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    
    setProjects(data || []);
    
    for (const project of data || []) {
      const { data: timelineData } = await supabase
        .from("project_timelines")
        .select("*")
        .eq("project_id", project.id)
        .order("start_date", { ascending: true });
      setTimelines(prev => ({ ...prev, [project.id]: timelineData || [] }));
    }
  };

  const fetchReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    setReports(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("public_profiles")
      .select("user_id, name, username")
      .order("name");
    setAllUsers(data || []);
  };

  const handleResolveBlocker = async (blockerId: string, taskId: string) => {
    const { error: blockerError } = await supabase
      .from("blockers")
      .update({ resolved: true })
      .eq("id", blockerId);

    const { error: taskError } = await supabase
      .from("tasks")
      .update({ status: "Ongoing" })
      .eq("id", taskId);

    if (blockerError || taskError) {
      toast({ title: "Error", description: "Failed to resolve blocker", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Blocker resolved" });
      await fetchBlockers();
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast({ title: "Error", description: "Project name is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("projects").insert({
      name: projectName.trim(),
      description: projectDescription.trim(),
      created_by: user?.id,
      members: selectedMembers
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Project created" });
      setProjectDialogOpen(false);
      setProjectName("");
      setProjectDescription("");
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
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
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
      toast({ title: "Success", description: "Timeline added" });
      setTimelineDialogOpen(false);
      setPhaseName("");
      setPhaseStart("");
      setPhaseEnd("");
      setPhaseDescription("");
      await fetchProjects();
    }
  };

  const handleDeleteReport = async (id: string) => {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Report deleted" });
      await fetchReports();
    }
  };

  const activeBlockers = blockers.filter(b => !b.resolved);
  const resolvedBlockers = blockers.filter(b => b.resolved);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <PageHeader
        title="Base"
        description="Manage blockers, projects, team directory, and shared resources"
      />

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team">Team Directory</TabsTrigger>
          <TabsTrigger value="blockers">
            Blockers
            {activeBlockers.length > 0 && (
              <Badge className="ml-2 bg-destructive">{activeBlockers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6">
          <Team />
        </TabsContent>

        <TabsContent value="blockers" className="mt-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Active Blockers</h2>
            {userRole === "admin" && (
              <Button onClick={() => setBlockerDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Blocker</Button>
            )}
          </div>
          <div className="space-y-4">
            {activeBlockers.length > 0 ? (
              activeBlockers.map((blocker) => (
                <Card key={blocker.id} className="p-6 border-l-4 border-l-destructive">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <h3 className="font-semibold text-foreground">{blocker.title || blocker.task?.title || "Unknown Task"}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{blocker.description}</p>
                      {blocker.stuck_reason && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Why stuck:</span> {blocker.stuck_reason}
                        </div>
                      )}
                      {blocker.fix_process && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Fix process:</span> {blocker.fix_process}
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Assignee: {blocker.task?.assignee?.name || "Unassigned"}</span>
                        <span>Created: {new Date(blocker.created_at).toLocaleDateString()}</span>
                        {blocker.due_date && <span>Due: {new Date(blocker.due_date).toLocaleDateString()}</span>}
                        {blocker.timeline && <span>Timeline: {blocker.timeline}</span>}
                      </div>
                    </div>
                    {userRole === "admin" && (
                      <Button
                        size="sm"
                        onClick={() => handleResolveBlocker(blocker.id, blocker.task_id)}
                        className="ml-4"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No active blockers</p>
              </Card>
            )}

            {resolvedBlockers.length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-foreground mt-8">Resolved Blockers</h2>
                {resolvedBlockers.map((blocker) => (
                  <Card key={blocker.id} className="p-6 opacity-60">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <h3 className="font-semibold text-foreground">{blocker.task?.title || "Unknown Task"}</h3>
                          <Badge variant="outline" className="bg-success/10 text-success">Resolved</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{blocker.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Projects</h2>
            {userRole === "admin" && (
              <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />New Project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>Add a new project with team members</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Project Name</Label>
                      <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <RichTextEditor 
                        value={projectDescription} 
                        onChange={(value) => setProjectDescription(value)} 
                        placeholder="Project description"
                        minHeight="100px"
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
                              {u.name || u.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedMembers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedMembers.map((id) => {
                            const member = allUsers.find(u => u.user_id === id);
                            return (
                              <div key={id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                                {member?.name || member?.username}
                                <button onClick={() => setSelectedMembers(selectedMembers.filter(m => m !== id))}>×</button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <Button onClick={handleCreateProject} className="w-full">Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-6">
            {projects.map((project) => (
              <Card key={project.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      {project.members && project.members.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {project.members.map((id: string) => {
                            const member = allUsers.find(u => u.user_id === id);
                            return (
                              <Badge key={id} variant="outline">{member?.name || member?.username}</Badge>
                            );
                          })}
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

                  {timelines[project.id]?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2 text-sm">Timeline</h4>
                      <div className="space-y-2">
                        {timelines[project.id].map((phase) => (
                          <div key={phase.id} className="p-3 bg-muted rounded-lg text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{phase.phase_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(phase.start_date), "MMM dd")} - {format(new Date(phase.end_date), "MMM dd, yyyy")}
                              </span>
                            </div>
                            {phase.description && <p className="text-muted-foreground mt-1">{phase.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Reports & Resources</h2>
            {userRole === "admin" && (
              <Button onClick={() => setReportDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />Add Report
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.id} className="p-6 hover-scale">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {report.type === "sheet" ? "Google Sheet" : report.type === "slide" ? "Google Slides" : "Link"}
                    </p>
                    <a href={report.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                      Open <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  {userRole === "admin" && (
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteReport(report.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={timelineDialogOpen} onOpenChange={setTimelineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Timeline Phase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Phase Name</Label>
              <Input value={phaseName} onChange={(e) => setPhaseName(e.target.value)} />
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
              <Label>Description</Label>
              <RichTextEditor 
                value={phaseDescription} 
                onChange={(value) => setPhaseDescription(value)} 
                placeholder="Phase description"
                minHeight="100px"
              />
            </div>
            <Button onClick={handleAddTimeline} className="w-full">Add Phase</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BlockerDialog open={blockerDialogOpen} onOpenChange={setBlockerDialogOpen} onSuccess={fetchBlockers} />
      <ProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} onSuccess={fetchProjects} />
      <ReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} onSuccess={fetchReports} />
    </div>
  );
}
