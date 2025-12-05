import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, ExternalLink } from "lucide-react";

interface Deal {
  id: string;
  name: string;
  website?: string | null;
  app_name?: string | null;
  description?: string | null;
  notes?: string | null;
  created_at: string;
}

interface DealsTableViewProps {
  deals: Deal[];
  onView: (deal: Deal) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
}

export function DealsTableView({ deals, onView, onEdit, onDelete }: DealsTableViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Brand Name</TableHead>
          <TableHead>Website</TableHead>
          <TableHead>App</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-[120px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.map((deal) => (
          <TableRow key={deal.id} className="group">
            <TableCell className="font-medium">{deal.name}</TableCell>
            <TableCell>
              {deal.website ? (
                <a 
                  href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {deal.website.replace(/^https?:\/\//, '').slice(0, 30)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {deal.app_name || <span className="text-muted-foreground">—</span>}
            </TableCell>
            <TableCell className="max-w-[300px] truncate">
              {deal.description || <span className="text-muted-foreground">—</span>}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onView(deal)}
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(deal)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(deal.id)}
                  title="Delete"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}