import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Trash2, FileText } from "lucide-react";
import { useCustomReports } from "@/hooks/useCustomReports";
import type { ReportDocument } from "@/types/report";
import { formatDistanceToNow } from "date-fns";

interface LoadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadReport: (report: ReportDocument) => void;
}

export function LoadReportDialog({ open, onOpenChange, onLoadReport }: LoadReportDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { reports, isLoading, deleteReport, isDeleting } = useCustomReports();

  const filteredReports = reports.filter((report) =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLoad = (report: ReportDocument) => {
    onLoadReport(report);
    onOpenChange(false);
  };

  const handleDelete = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this report?")) {
      deleteReport(reportId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Load Report</DialogTitle>
          <DialogDescription>
            Select a previously saved report to continue editing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No reports found matching your search" : "No saved reports yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => handleLoad(report)}
                    className="group flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{report.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{report.elements.length} elements</span>
                        <span>•</span>
                        <span>
                          Updated {formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, report.id)}
                      disabled={isDeleting}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
