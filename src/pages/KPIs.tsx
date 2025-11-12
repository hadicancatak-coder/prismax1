import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Target } from "lucide-react";
import { useKPIs } from "@/hooks/useKPIs";
import { useAuth } from "@/hooks/useAuth";
import { CreateKPIDialog } from "@/components/kpi/CreateKPIDialog";
import { AssignKPIDialog } from "@/components/kpi/AssignKPIDialog";
import { KPICard } from "@/components/kpi/KPICard";
import { Skeleton } from "@/components/ui/skeleton";
import type { TeamKPI } from "@/types/kpi";

export default function KPIs() {
  const { userRole, user } = useAuth();
  const { kpis, isLoading, createKPI, deleteKPI, assignKPI } = useKPIs();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<TeamKPI | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const isAdmin = userRole === 'admin';

  // Filter KPIs based on user role
  const displayKPIs = useMemo(() => {
    let filtered = kpis;

    // Role-based filtering
    if (!isAdmin) {
      // Members only see their assigned KPIs
      filtered = kpis.filter(kpi => 
        kpi.assignments?.some(assignment => 
          assignment.user_id === user?.id && 
          assignment.status === 'approved'
        )
      );
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(kpi =>
        kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kpi.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(kpi => kpi.type === filterType);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(kpi => kpi.status === filterStatus);
    }

    return filtered;
  }, [kpis, isAdmin, user, searchQuery, filterType, filterStatus]);

  const handleCreateKPI = async (data: any) => {
    await createKPI.mutateAsync(data);
    setShowCreateDialog(false);
  };

  const handleAssignKPI = (kpi: TeamKPI) => {
    setSelectedKPI(kpi);
    setShowAssignDialog(true);
  };

  const handleAssignSubmit = async (assignments: Array<{ user_id?: string; team_name?: string; notes?: string }>) => {
    if (!selectedKPI) return;

    for (const assignment of assignments) {
      await assignKPI.mutateAsync({
        kpi_id: selectedKPI.id,
        user_id: assignment.user_id || null,
        team_name: assignment.team_name || null,
        assigned_by: user!.id,
        notes: assignment.notes || null,
        status: 'pending',
      });
    }

    setShowAssignDialog(false);
    setSelectedKPI(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalKPIs = displayKPIs.length;
  const activeKPIs = displayKPIs.filter(k => k.status === 'active').length;
  const completedKPIs = displayKPIs.filter(k => k.status === 'completed').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title font-bold text-foreground">
            {isAdmin ? 'All KPIs' : 'My KPIs'}
          </h1>
          <p className="text-body text-muted-foreground mt-1">
            {isAdmin ? 'Manage team KPIs and assignments' : 'Track your assigned KPIs'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create KPI
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KPIs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKPIs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeKPIs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedKPIs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search KPIs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
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
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayKPIs.map(kpi => (
          <KPICard
            key={kpi.id}
            kpi={kpi}
            onDelete={isAdmin ? () => deleteKPI.mutate(kpi.id) : undefined}
            onAssign={isAdmin ? () => handleAssignKPI(kpi) : undefined}
          />
        ))}
      </div>

      {displayKPIs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-body text-muted-foreground">
              {isAdmin ? 'No KPIs found. Create your first KPI to get started.' : 'No KPIs assigned to you yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {isAdmin && (
        <>
          <CreateKPIDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onSubmit={handleCreateKPI}
          />
          
          {selectedKPI && (
            <AssignKPIDialog
              open={showAssignDialog}
              onOpenChange={setShowAssignDialog}
              kpi={selectedKPI}
              onAssign={handleAssignSubmit}
            />
          )}
        </>
      )}
    </div>
  );
}
