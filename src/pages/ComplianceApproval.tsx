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
import { useComplianceRequests } from "@/hooks/useComplianceRequests";

export default function ComplianceApproval() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { requests, isLoading } = useComplianceRequests();

  const filteredRequests = requests?.filter((request) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

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
      />

      <CreateComplianceRequestDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
