import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, ArrowUpDown, CheckCircle2 } from "lucide-react";
import { useUpdateCopywriterCopy, useDeleteCopywriterCopy, CopywriterCopy } from "@/hooks/useCopywriterCopies";
import { useAuth } from "@/hooks/useAuth";
import { syncCopyToPlanners } from "@/lib/copywriterSync";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { CampaignsTagsInput } from "./CampaignsTagsInput";

interface SavedCopiesTableViewProps {
  copies: CopywriterCopy[];
  onRefresh?: () => void;
}

const CHAR_LIMITS: Record<string, Record<string, number>> = {
  headline: { ppc: 30, facebook: 40, instagram: 40, tiktok: 100, snap: 34, reddit: 300, whatsapp: 60 },
  description: { ppc: 90, facebook: 125, instagram: 125, tiktok: 100, snap: 80, reddit: 300, whatsapp: 4096 },
  primary_text: { ppc: 60, facebook: 125, instagram: 2200, tiktok: 100, snap: 80, reddit: 300, whatsapp: 1024 },
  callout: { ppc: 25, facebook: 40, instagram: 40, tiktok: 100, snap: 34, reddit: 300, whatsapp: 60 },
  sitelink: { ppc: 25, facebook: 40, instagram: 40, tiktok: 100, snap: 34, reddit: 300, whatsapp: 60 },
};

export function SavedCopiesTableView({ copies, onRefresh }: SavedCopiesTableViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  const updateCopyMutation = useUpdateCopywriterCopy();
  const deleteCopyMutation = useDeleteCopywriterCopy();

  const sortedCopies = [...copies].sort((a, b) => {
    const aVal = a[sortField as keyof CopywriterCopy];
    const bVal = b[sortField as keyof CopywriterCopy];
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleUpdateField = (id: string, field: string, value: any) => {
    updateCopyMutation.mutate({ id, updates: { [field]: value } });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this copy?")) {
      deleteCopyMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} copies?`)) {
      selectedIds.forEach((id) => deleteCopyMutation.mutate(id));
      setSelectedIds(new Set());
    }
  };

  const handleSync = async (copy: CopywriterCopy) => {
    try {
      await syncCopyToPlanners({ copy });
      await updateCopyMutation.mutateAsync({
        id: copy.id,
        updates: { is_synced_to_planner: true },
      });
      toast({ title: "Copy synced to planners" });
    } catch (error: any) {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    }
  };

  const getCharLimit = (type: string, platforms: string[]): number => {
    const limits = CHAR_LIMITS[type] || {};
    const platformLimits = platforms.map((p) => limits[p] || 125).filter((l) => l > 0);
    return platformLimits.length > 0 ? Math.min(...platformLimits) : 125;
  };

  const getStatusColor = (count: number, limit: number) => {
    if (count > limit) return "destructive";
    return "default";
  };

  const getStatusText = (count: number, limit: number) => {
    if (count > limit) return "NEEDS TO BE REDUCED";
    return "Limit Available";
  };

  const stripHtml = (html: string | null): string => {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const renderContentCell = (copy: CopywriterCopy, field: "content_en" | "content_ar" | "content_az") => {
    const content = copy[field] || "";
    const plainText = stripHtml(content);
    const isEditing = editingCell?.id === copy.id && editingCell?.field === field;
    const canEdit = user?.id === copy.created_by || user?.role === "admin";

    if (isEditing && canEdit) {
      return (
        <div className="h-[44px] overflow-hidden">
          <RichTextEditor
            value={content}
            onChange={(value) => handleUpdateField(copy.id, field, value)}
            onBlur={() => setEditingCell(null)}
            autoFocus
            className="text-xs"
            minHeight="44px"
          />
        </div>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="cursor-pointer h-[44px] flex items-center overflow-hidden text-ellipsis line-clamp-2"
              onClick={() => canEdit && setEditingCell({ id: copy.id, field })}
            >
              <span className="text-xs">{plainText || "-"}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md">
            <div className="text-xs whitespace-pre-wrap">{plainText}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (copies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No copies found. Create your first copy to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-auto max-h-[calc(100vh-300px)]">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 bg-background z-10 border-b">
            <TableRow className="h-[44px] hover:bg-transparent">
              <TableHead className="w-12 border-r">
                <input
                  type="checkbox"
                  checked={selectedIds.size === copies.length}
                  onChange={() => {
                    if (selectedIds.size === copies.length) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(copies.map((c) => c.id)));
                    }
                  }}
                />
              </TableHead>
              <TableHead className="w-[100px] border-r">
                <Button variant="ghost" size="sm" onClick={() => toggleSort("region")} className="h-8 px-2 text-xs">
                  Region <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[140px] border-r text-xs">Campaign</TableHead>
              <TableHead className="w-[100px] border-r">
                <Button variant="ghost" size="sm" onClick={() => toggleSort("element_type")} className="h-8 px-2 text-xs">
                  Type <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              
              <TableHead className="w-[250px] border-r text-xs">English</TableHead>
              <TableHead className="w-[60px] border-r text-right text-xs">EN Cnt</TableHead>
              <TableHead className="w-[80px] border-r text-xs">EN Limit</TableHead>
              <TableHead className="w-[140px] border-r text-xs">EN Status</TableHead>

              <TableHead className="w-[250px] border-r text-xs">Arabic</TableHead>
              <TableHead className="w-[60px] border-r text-right text-xs">AR Cnt</TableHead>
              <TableHead className="w-[80px] border-r text-xs">AR Limit</TableHead>
              <TableHead className="w-[140px] border-r text-xs">AR Status</TableHead>

              <TableHead className="w-[250px] border-r text-xs">Azerice</TableHead>
              <TableHead className="w-[60px] border-r text-right text-xs">AZ Cnt</TableHead>
              <TableHead className="w-[80px] border-r text-xs">AZ Limit</TableHead>
              <TableHead className="w-[140px] border-r text-xs">AZ Status</TableHead>

              <TableHead className="w-[100px] text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCopies.map((copy, idx) => {
              const defaultLimit = getCharLimit(copy.element_type, copy.platform);
              const enCount = stripHtml(copy.content_en).length;
              const arCount = stripHtml(copy.content_ar).length;
              const azCount = stripHtml(copy.content_az).length;
              const enLimit = copy.char_limit_en || defaultLimit;
              const arLimit = copy.char_limit_ar || defaultLimit;
              const azLimit = copy.char_limit_az || defaultLimit;

              return (
                <TableRow key={copy.id} className={`h-[44px] max-h-[44px] border-b ${idx % 2 === 0 ? "bg-muted/30" : ""}`}>
                  <TableCell className="h-[44px] border-r">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(copy.id)}
                      onChange={() => toggleSelect(copy.id)}
                    />
                  </TableCell>
                  <TableCell className="h-[44px] border-r">
                    <Select
                      value={copy.region || ""}
                      onValueChange={(value) => handleUpdateField(copy.id, "region", value)}
                    >
                      <SelectTrigger className="h-8 text-xs border-0">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MENA">MENA</SelectItem>
                        <SelectItem value="LATAM">LATAM</SelectItem>
                        <SelectItem value="Global">Global</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="h-[44px] border-r">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                      <CampaignsTagsInput
                        value={copy.campaigns}
                        onChange={(campaigns) => handleUpdateField(copy.id, "campaigns", campaigns)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="h-[44px] border-r">
                    <Badge variant="outline" className="text-xs">{copy.element_type}</Badge>
                  </TableCell>

                  {/* English */}
                  <TableCell className="h-[44px] border-r">{renderContentCell(copy, "content_en")}</TableCell>
                  <TableCell className="h-[44px] border-r text-right">
                    <span className={`text-xs font-mono ${enCount > enLimit ? "text-destructive font-bold" : ""}`}>
                      {enCount}
                    </span>
                  </TableCell>
                  <TableCell className="h-[44px] border-r">
                    <Input
                      type="number"
                      value={enLimit}
                      onChange={(e) => handleUpdateField(copy.id, "char_limit_en", parseInt(e.target.value) || defaultLimit)}
                      className="h-8 w-16 text-xs border-0"
                    />
                  </TableCell>
                  <TableCell className="h-[44px] border-r">
                    <Badge variant={getStatusColor(enCount, enLimit)} className="text-xs whitespace-nowrap">
                      {getStatusText(enCount, enLimit)}
                    </Badge>
                  </TableCell>

                  {/* Arabic */}
                  <TableCell className="h-[44px] border-r">{renderContentCell(copy, "content_ar")}</TableCell>
                  <TableCell className="h-[44px] border-r text-right">
                    <span className={`text-xs font-mono ${arCount > arLimit ? "text-destructive font-bold" : ""}`}>
                      {arCount}
                    </span>
                  </TableCell>
                  <TableCell className="h-[44px] border-r">
                    <Input
                      type="number"
                      value={arLimit}
                      onChange={(e) => handleUpdateField(copy.id, "char_limit_ar", parseInt(e.target.value) || defaultLimit)}
                      className="h-8 w-16 text-xs border-0"
                    />
                  </TableCell>
                  <TableCell className="h-[44px] border-r">
                    <Badge variant={getStatusColor(arCount, arLimit)} className="text-xs whitespace-nowrap">
                      {getStatusText(arCount, arLimit)}
                    </Badge>
                  </TableCell>

                  {/* Azerice */}
                  <TableCell className="h-[44px] border-r">{renderContentCell(copy, "content_az")}</TableCell>
                  <TableCell className="h-[44px] border-r text-right">
                    <span className={`text-xs font-mono ${azCount > azLimit ? "text-destructive font-bold" : ""}`}>
                      {azCount}
                    </span>
                  </TableCell>
                  <TableCell className="h-[44px] border-r">
                    <Input
                      type="number"
                      value={azLimit}
                      onChange={(e) => handleUpdateField(copy.id, "char_limit_az", parseInt(e.target.value) || defaultLimit)}
                      className="h-8 w-16 text-xs border-0"
                    />
                  </TableCell>
                  <TableCell className="h-[44px] border-r">
                    <Badge variant={getStatusColor(azCount, azLimit)} className="text-xs whitespace-nowrap">
                      {getStatusText(azCount, azLimit)}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="h-[44px]">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(copy)}
                        disabled={copy.is_synced_to_planner}
                        className="h-7 px-2"
                      >
                        <CheckCircle2 className={`h-3 w-3 ${copy.is_synced_to_planner ? "text-green-500" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(copy.id)}
                        className="h-7 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
