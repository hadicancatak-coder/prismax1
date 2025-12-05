import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ExternalLink, Globe, Smartphone, FileText, StickyNote } from "lucide-react";

interface DealDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: any;
  onEdit: () => void;
  onDelete: () => void;
}

export function DealDetailDialog({ open, onOpenChange, deal, onEdit, onDelete }: DealDetailDialogProps) {
  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl">{deal.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Website */}
          {deal.website && (
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Website</p>
                <a
                  href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {deal.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* App */}
          {deal.app_name && (
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">App</p>
                <p>{deal.app_name}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {deal.description && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{deal.description}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {deal.notes && (
            <div className="flex items-start gap-3">
              <StickyNote className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
              </div>
            </div>
          )}

          {/* Empty state if no details */}
          {!deal.website && !deal.app_name && !deal.description && !deal.notes && (
            <p className="text-muted-foreground text-center py-4">No additional details added yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}