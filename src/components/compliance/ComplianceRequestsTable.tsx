import { useState } from "react";
import { format } from "date-fns";
import { ExternalLink, Eye, Copy, Upload } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceRequest } from "@/hooks/useComplianceRequests";
import { ComplianceRequestDetailDialog } from "./ComplianceRequestDetailDialog";
import { toast } from "sonner";

interface ComplianceRequestsTableProps {
  requests: ComplianceRequest[];
  isLoading: boolean;
}

export function ComplianceRequestsTable({
  requests,
  isLoading,
}: ComplianceRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<ComplianceRequest | null>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      partial: "outline",
    };

    const labels: Record<string, string> = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      partial: "Partial",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const copyReviewLink = (token: string) => {
    const url = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Review link copied to clipboard");
  };

  const getReviewProgress = (request: ComplianceRequest) => {
    const assets = request.assets || [];
    const total = assets.length;
    const approved = assets.filter((a) => a.status === "approved").length;
    return `${approved}/${total}`;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (!requests.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No compliance requests yet. Create your first one!
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Reviews</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.title}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>{request.assets?.length || 0}</TableCell>
                <TableCell>{getReviewProgress(request)}</TableCell>
                <TableCell>
                  {format(new Date(request.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyReviewLink(request.public_link_token)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedRequest && (
        <ComplianceRequestDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        />
      )}
    </>
  );
}
