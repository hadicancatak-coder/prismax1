import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { useTeamKPIs } from "@/hooks/useTeamKPIs";
import { KPICard } from "@/components/kpi/KPICard";
import { CreateKPIDialog } from "@/components/kpi/CreateKPIDialog";
import { AssignKPIDialog } from "@/components/kpi/AssignKPIDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { TeamKPI } from "@/types/kpi";

export default function TeamKPIs() {
  const { user } = useAuth();
  const { kpis, isLoading, createKPI, deleteKPI, assignKPI } = useTeamKPIs();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<TeamKPI | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredKPIs = kpis.filter((kpi) => {
    const matchesSearch = kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || kpi.type === filterType;
    const matchesStatus = filterStatus === "all" || kpi.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateKPI = (data: any) => {
    createKPI.mutate({ ...data, created_by: user?.id });
  };

  const handleAssignKPI = (kpi: TeamKPI) => {
    setSelectedKPI(kpi);
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = async (assignments: any[]) => {
    for (const assignment of assignments) {
      await assignKPI.mutateAsync(assignment);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title">Team KPIs</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track key performance indicators across your team
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create KPI
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search KPIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total KPIs</div>
          <div className="text-2xl font-bold mt-1">{kpis.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold mt-1 text-green-500">
            {kpis.filter((k) => k.status === 'active').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending Approval</div>
          <div className="text-2xl font-bold mt-1 text-yellow-500">
            {kpis.filter((k) => k.status === 'pending_approval').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold mt-1 text-blue-500">
            {kpis.filter((k) => k.status === 'completed').length}
          </div>
        </Card>
      </div>

      {/* KPI Cards */}
      {filteredKPIs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No KPIs found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create your first KPI
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredKPIs.map((kpi) => (
            <KPICard
              key={kpi.id}
              kpi={kpi}
              onDelete={(id) => deleteKPI.mutate(id)}
              onAssign={handleAssignKPI}
            />
          ))}
        </div>
      )}

      <CreateKPIDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateKPI}
      />

      <AssignKPIDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        kpi={selectedKPI}
        onAssign={handleAssignSubmit}
      />
    </div>
  );
}
