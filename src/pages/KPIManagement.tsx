import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Edit2, Trash2, Users, Calendar, Target as TargetIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssigneeMultiSelect } from "@/components/AssigneeMultiSelect";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface KPI {
  id: string;
  title: string;
  description: string | null;
  metric_type: 'percentage' | 'count';
  target: number;
  deadline: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignments: Array<{ user_id: string; profiles: { name: string; avatar_url: string | null } }>;
}

const KPIManagement = () => {
  const { userRole, user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    metric_type: "percentage" as "percentage" | "count",
    target: 0,
    deadline: "",
    assignees: [] as string[],
  });

  const { data: kpis, isLoading } = useQuery({
    queryKey: ["kpis", userRole],
    queryFn: async () => {
      let query = supabase
        .from("kpis")
        .select(`
          *,
          assignments:kpi_assignments(user_id)
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user names separately
      if (data) {
        const userIds = [...new Set(data.flatMap(kpi => kpi.assignments.map((a: any) => a.user_id)))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        return data.map(kpi => ({
          ...kpi,
          assignments: kpi.assignments.map((a: any) => ({
            user_id: a.user_id,
            profiles: profileMap.get(a.user_id) || { name: "Unknown", avatar_url: null },
          })),
        })) as KPI[];
      }

      return [];
    },
  });

  const { data: allUsers } = useQuery({
    queryKey: ["profiles-for-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, username")
        .order("name");
      if (error) throw error;
      return data as Array<{ user_id: string; name: string; username: string | null }>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { assignees, ...kpiData } = data;
      
      const { data: newKPI, error: kpiError } = await supabase
        .from("kpis")
        .insert({
          ...kpiData,
          created_by: user?.id,
          deadline: data.deadline || null,
        })
        .select()
        .single();

      if (kpiError) throw kpiError;

      if (assignees.length > 0) {
        const assignments = assignees.map(userId => ({
          kpi_id: newKPI.id,
          user_id: userId,
          assigned_by: user?.id,
        }));

        const { error: assignError } = await supabase
          .from("kpi_assignments")
          .insert(assignments);

        if (assignError) throw assignError;
      }

      return newKPI;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast.success("KPI created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create KPI");
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { assignees, ...kpiData } = data;

      const { error: updateError } = await supabase
        .from("kpis")
        .update({
          ...kpiData,
          deadline: data.deadline || null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Delete existing assignments
      await supabase.from("kpi_assignments").delete().eq("kpi_id", id);

      // Add new assignments
      if (assignees.length > 0) {
        const assignments = assignees.map(userId => ({
          kpi_id: id,
          user_id: userId,
          assigned_by: user?.id,
        }));

        const { error: assignError } = await supabase
          .from("kpi_assignments")
          .insert(assignments);

        if (assignError) throw assignError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast.success("KPI updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update KPI");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kpis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast.success("KPI deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete KPI");
    },
  });

  const handleEdit = (kpi: KPI) => {
    setEditingKPI(kpi);
    setFormData({
      title: kpi.title,
      description: kpi.description || "",
      metric_type: kpi.metric_type,
      target: kpi.target,
      deadline: kpi.deadline ? kpi.deadline.split('T')[0] : "",
      assignees: kpi.assignments.map(a => a.user_id),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this KPI?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingKPI(null);
    setFormData({
      title: "",
      description: "",
      metric_type: "percentage",
      target: 0,
      deadline: "",
      assignees: [],
    });
  };

  const handleSubmit = () => {
    if (!formData.title || formData.target <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingKPI) {
      updateMutation.mutate({ id: editingKPI.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isAdmin = userRole === "admin";

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-foreground">KPI Management</h1>
          <p className="text-metadata mt-1">
            {isAdmin ? "Create and manage team KPIs" : "View your assigned KPIs"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create KPI
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {kpis && kpis.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {isAdmin ? "No KPIs created yet. Create your first KPI to get started." : "No KPIs assigned to you yet."}
            </p>
          </Card>
        ) : (
          kpis?.map((kpi) => (
            <Card key={kpi.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-section-title text-foreground font-semibold">{kpi.title}</h3>
                    <Badge variant="outline">
                      {kpi.metric_type === "percentage" ? "%" : "Count"}
                    </Badge>
                  </div>
                  
                  {kpi.description && (
                    <p className="text-body text-muted-foreground mb-4">{kpi.description}</p>
                  )}

                  <div className="flex items-center gap-6 text-metadata">
                    <div className="flex items-center gap-2">
                      <TargetIcon className="h-4 w-4 text-primary" />
                      <span>Target: {kpi.target}{kpi.metric_type === "percentage" ? "%" : ""}</span>
                    </div>
                    
                    {kpi.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(kpi.deadline), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    
                    {kpi.assignments.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{kpi.assignments.length} {kpi.assignments.length === 1 ? "assignee" : "assignees"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(kpi)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(kpi.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingKPI ? "Edit KPI" : "Create New KPI"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Increase conversion rate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the KPI and its purpose"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metric_type">Metric Type *</Label>
                <Select
                  value={formData.metric_type}
                  onValueChange={(value: "percentage" | "count") =>
                    setFormData({ ...formData, metric_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target *</Label>
                <Input
                  id="target"
                  type="number"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: Number(e.target.value) })}
                  placeholder="e.g., 85"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Assignees</Label>
              <AssigneeMultiSelect
                users={allUsers?.map(u => ({ user_id: u.user_id, name: u.name, username: u.username || '' })) || []}
                selectedUserIds={formData.assignees}
                onSelectionChange={(assignees) => setFormData({ ...formData, assignees })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingKPI ? "Update" : "Create"} KPI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KPIManagement;