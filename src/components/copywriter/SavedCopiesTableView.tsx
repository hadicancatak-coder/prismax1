import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Trash2, Upload, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { CopywriterCopy, useUpdateCopywriterCopy, useDeleteCopywriterCopy } from "@/hooks/useCopywriterCopies";
import { syncCopyToPlanners } from "@/lib/copywriterSync";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ENTITIES } from "@/lib/constants";
import { PlatformMultiSelect } from "./PlatformMultiSelect";
import { CampaignsTagsInput } from "./CampaignsTagsInput";

const ELEMENT_TYPES = ["headline", "description", "primary_text", "callout", "sitelink"];

interface SavedCopiesTableViewProps {
  copies: CopywriterCopy[];
  onRefresh?: () => void;
}

export function SavedCopiesTableView({ copies, onRefresh }: SavedCopiesTableViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isAddingRow, setIsAddingRow] = useState(false);

  const updateCopy = useUpdateCopywriterCopy();
  const deleteCopy = useDeleteCopywriterCopy();

  const sortedCopies = [...copies].sort((a, b) => {
    let aVal = a[sortField as keyof CopywriterCopy];
    let bVal = b[sortField as keyof CopywriterCopy];
    
    if (sortField.startsWith("content_")) {
      aVal = aVal || "";
      bVal = bVal || "";
    }
    
    if (aVal === bVal) return 0;
    const comparison = aVal > bVal ? 1 : -1;
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleSelectAll = () => {
    setSelected(selected.length === copies.length ? [] : copies.map(c => c.id));
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleUpdateField = async (id: string, field: string, value: any) => {
    try {
      await updateCopy.mutateAsync({ id, updates: { [field]: value } });
      setEditingCell(null);
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error updating",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this copy?")) return;
    try {
      await deleteCopy.mutateAsync(id);
      toast({ title: "Copy deleted" });
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSync = async (copy: CopywriterCopy) => {
    try {
      await syncCopyToPlanners({ copy });
      await handleUpdateField(copy.id, "is_synced_to_planner", true);
      toast({ title: "Synced to planners" });
    } catch (error: any) {
      toast({
        title: "Error syncing",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} copies?`)) return;
    try {
      await Promise.all(selected.map(id => deleteCopy.mutateAsync(id)));
      setSelected([]);
      toast({ title: `Deleted ${selected.length} copies` });
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error bulk deleting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCharLimit = (type: string, platforms: string[]) => {
    const hasPPC = platforms.includes("ppc");
    const hasSocial = platforms.some(p => ["facebook", "instagram", "tiktok", "snap", "reddit", "whatsapp"].includes(p));
    
    switch (type) {
      case "headline":
        return hasPPC && !hasSocial ? 30 : 60;
      case "description":
        return hasPPC && !hasSocial ? 90 : 125;
      case "primary_text":
        return 125;
      case "callout":
      case "sitelink":
        return 25;
      default:
        return 1000;
    }
  };

  const getCharLimitColor = (length: number, limit: number) => {
    const percent = (length / limit) * 100;
    if (percent > 100) return "text-destructive";
    if (percent >= 80) return "text-orange-500";
    return "text-muted-foreground";
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-4">
      {selected.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selected.length === copies.length && copies.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("element_type")}>
                <div className="flex items-center gap-1">
                  Type <SortIcon field="element_type" />
                </div>
              </TableHead>
              <TableHead>Platforms</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Campaigns</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("content_en")}>
                <div className="flex items-center gap-1">
                  EN Content <SortIcon field="content_en" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("content_ar")}>
                <div className="flex items-center gap-1">
                  AR Content <SortIcon field="content_ar" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("content_az")}>
                <div className="flex items-center gap-1">
                  AZ Content <SortIcon field="content_az" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("content_es")}>
                <div className="flex items-center gap-1">
                  ES Content <SortIcon field="content_es" />
                </div>
              </TableHead>
              <TableHead className="w-20 text-center">Synced</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCopies.map((copy) => {
              const charLimit = getCharLimit(copy.element_type, copy.platform);
              const canEdit = user?.id === copy.created_by || user?.role === "admin";
              
              return (
                <TableRow key={copy.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(copy.id)}
                      onCheckedChange={() => toggleSelect(copy.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={copy.element_type}
                      onValueChange={(val) => handleUpdateField(copy.id, "element_type", val)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ELEMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <PlatformMultiSelect
                      value={copy.platform}
                      onChange={(val) => handleUpdateField(copy.id, "platform", val)}
                      disabled={!canEdit}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {copy.entity?.map((ent) => (
                        <Badge key={ent} variant="outline" className="text-xs">
                          {ent}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CampaignsTagsInput
                      value={copy.campaigns || []}
                      onChange={(val) => handleUpdateField(copy.id, "campaigns", val)}
                      disabled={!canEdit}
                    />
                  </TableCell>
                  {["content_en", "content_ar", "content_az", "content_es"].map((field) => (
                    <TableCell key={field} className="max-w-[250px]">
                      {editingCell?.id === copy.id && editingCell?.field === field ? (
                        <div className="space-y-1">
                          <Textarea
                            value={copy[field as keyof CopywriterCopy] as string || ""}
                            onChange={(e) => {
                              const newCopies = copies.map(c =>
                                c.id === copy.id ? { ...c, [field]: e.target.value } : c
                              );
                            }}
                            onBlur={(e) => handleUpdateField(copy.id, field, e.target.value || null)}
                            className={`min-h-[60px] text-sm ${field === "content_ar" ? "text-right" : ""}`}
                            dir={field === "content_ar" ? "rtl" : "ltr"}
                            autoFocus
                          />
                          <span className={`text-xs ${getCharLimitColor(
                            (copy[field as keyof CopywriterCopy] as string || "").length,
                            charLimit
                          )}`}>
                            {(copy[field as keyof CopywriterCopy] as string || "").length}/{charLimit}
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`text-sm cursor-pointer hover:bg-muted/50 p-2 rounded min-h-[40px] ${
                            field === "content_ar" ? "text-right" : ""
                          }`}
                          onClick={() => canEdit && setEditingCell({ id: copy.id, field })}
                        >
                          {copy[field as keyof CopywriterCopy] as string || (
                            <span className="text-muted-foreground italic">Click to add</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    {copy.is_synced_to_planner && (
                      <Check className="h-4 w-4 text-green-600 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSync(copy)}
                        disabled={!canEdit}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(copy.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {sortedCopies.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No copies found. Click "Add New Copy" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
