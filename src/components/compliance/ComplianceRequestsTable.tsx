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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ComplianceRequest } from "@/hooks/useComplianceRequests";
import { ComplianceRequestDetailDialog } from "./ComplianceRequestDetailDialog";
import { toast } from "sonner";

interface ComplianceRequestsTableProps {
  requests: ComplianceRequest[];
  isLoading: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ComplianceRequestsTable({
  requests,
  isLoading,
  selectedIds,
  onSelectionChange,
}: ComplianceRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<ComplianceRequest | null>(null);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState<string | null>(null);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(requests.map((r) => r.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const copyReviewLink = (token: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Review link copied to clipboard");
  };

  const openReviewPage = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`${window.location.origin}/review/${token}`, "_blank", "noopener,noreferrer");
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
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === requests.length && requests.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
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
              <TableRow
                key={request.id}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => setSelectedRequest(request)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(request.id)}
                    onCheckedChange={() => handleSelectRow(request.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{request.title}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>{request.assets?.length || 0}</TableCell>
                <TableCell>{getReviewProgress(request)}</TableCell>
                <TableCell>
                  {format(new Date(request.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Popover
                    open={linkPopoverOpen === request.id}
                    onOpenChange={(open) => setLinkPopoverOpen(open ? request.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">External Review Link</h4>
                        <div className="bg-muted p-2 rounded text-xs break-all font-mono">
                          {window.location.origin}/review/{request.public_link_token}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={(e) => {
                              copyReviewLink(request.public_link_token, e);
                              setLinkPopoverOpen(null);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button
                            onClick={(e) => {
                              openReviewPage(request.public_link_token, e);
                              setLinkPopoverOpen(null);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
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
