import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Trash, Edit2, Star, ArrowUpDown } from "lucide-react";
import { useUpdateAdElement, useDeleteAdElement } from "@/hooks/useAdElements";
import { toast } from "@/hooks/use-toast";
import { UpdateGoogleStatusDialog } from "./UpdateGoogleStatusDialog";

interface SavedElementsTableViewProps {
  elements: any[];
  onRefresh?: () => void;
}

export function SavedElementsTableView({ elements, onRefresh }: SavedElementsTableViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'use_count' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);

  const updateElement = useUpdateAdElement();
  const deleteElement = useDeleteAdElement();

  const sortedElements = [...elements].sort((a, b) => {
    const aVal = a[sortField] || 0;
    const bVal = b[sortField] || 0;
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (field: 'use_count' | 'created_at') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === elements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(elements.map(e => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleToggleFavorite = async (element: any) => {
    await updateElement.mutateAsync({
      id: element.id,
      updates: { is_favorite: !element.is_favorite }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this element?")) {
      await deleteElement.mutateAsync(id);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} elements?`)) {
      await Promise.all(selectedIds.map(id => deleteElement.mutateAsync(id)));
      setSelectedIds([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === elements.length && elements.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('use_count')}>
                <div className="flex items-center gap-1">
                  Uses <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('created_at')}>
                <div className="flex items-center gap-1">
                  Created <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedElements.map((element) => (
              <TableRow key={element.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(element.id)}
                    onCheckedChange={() => toggleSelect(element.id)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleToggleFavorite(element)}
                  >
                    <Star className={`h-4 w-4 ${element.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </Button>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="line-clamp-2 text-sm">{element.content?.text || element.content}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {element.entity?.slice(0, 2).map((ent: string) => (
                      <Badge key={ent} variant="outline" className="text-xs">{ent}</Badge>
                    ))}
                    {element.entity?.length > 2 && (
                      <Badge variant="outline" className="text-xs">+{element.entity.length - 2}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{element.language || 'EN'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs cursor-pointer ${getStatusColor(element.google_status)}`}
                    onClick={() => {
                      setSelectedElement(element);
                      setStatusDialogOpen(true);
                    }}
                  >
                    {element.google_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {element.use_count || 0}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(element.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleCopy(element.content?.text || element.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDelete(element.id)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedElement && (
        <UpdateGoogleStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          element={selectedElement}
        />
      )}
    </div>
  );
}
