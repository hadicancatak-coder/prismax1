import { useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComplianceRequestsTable } from "@/components/compliance/ComplianceRequestsTable";
import { CreateComplianceRequestDialog } from "@/components/compliance/CreateComplianceRequestDialog";
import { LegalBulkActionsBar } from "@/components/compliance/LegalBulkActionsBar";
import { useComplianceRequests } from "@/hooks/useComplianceRequests";
import { toast } from "sonner";

export default function ComplianceApproval() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { requests, isLoading, bulkDeleteRequests, bulkUpdateStatus } = useComplianceRequests();

  const filteredRequests = requests?.filter((request) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

  const handleBulkDelete = () => {
    bulkDeleteRequests(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkStatusChange = (status: string) => {
    bulkUpdateStatus({ requestIds: selectedIds, status });
    setSelectedIds([]);
  };

  const handleExport = () => {
    const selectedRequests = requests?.filter((r) => selectedIds.includes(r.id)) || [];
    const csvContent = [
      ["Title", "Status", "Entity", "Assets", "Created"],
      ...selectedRequests.map((r) => [
        r.title,
        r.status,
        r.entity || "",
        r.assets?.length || 0,
        new Date(r.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `legal-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Export completed");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            Legal Logs
          </h1>
          <p className="text-muted-foreground">
            Manage legal review requests and track approval status
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ComplianceRequestsTable
        requests={filteredRequests || []}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <LegalBulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        onExport={handleExport}
      />

      <CreateComplianceRequestDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
