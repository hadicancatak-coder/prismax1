import { useState, useEffect, useRef } from "react";
import { CopywriterCopy } from "@/hooks/useCopywriterCopies";
import {
  useUpdateCopywriterCopy,
  useDeleteCopywriterCopy,
  useCreateCopywriterCopy,
} from "@/hooks/useCopywriterCopies";
import { syncCopyToPlanners } from "@/lib/copywriterSync";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { CampaignsTagsInput } from "@/components/copywriter/CampaignsTagsInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENTITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ConfirmPopover } from "@/components/ui/ConfirmPopover";

const ELEMENT_TYPES = ["headline", "description", "primary_text", "callout", "sitelink"];

interface SavedCopiesTableViewProps {
  copies: CopywriterCopy[];
  activeLanguages: string[];
  addingNewRow: boolean;
  onNewRowComplete: () => void;
  onRefresh?: () => void;
}

interface NewRowData {
  entity: string;
  campaigns: string[];
  element_type: string;
  content_en: string;
  content_ar: string;
  content_es: string;
  content_az: string;
  char_limit_en: number | null;
  char_limit_ar: number | null;
  char_limit_es: number | null;
  char_limit_az: number | null;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  es: "Spanish",
  az: "Azerice",
};

export function SavedCopiesTableView({ 
  copies, 
  activeLanguages,
  addingNewRow,
  onNewRowComplete,
  onRefresh 
}: SavedCopiesTableViewProps) {
  const { user } = useAuth();
  const isGuest = user?.user_metadata?.role === "guest";

  const [selected, setSelected] = useState<string[]>([]);
  const [newRow, setNewRow] = useState<NewRowData | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isAnyEditing, setIsAnyEditing] = useState(false);

  const newRowEnglishRef = useRef<HTMLDivElement>(null);

  const updateMutation = useUpdateCopywriterCopy();
  const deleteMutation = useDeleteCopywriterCopy();
  const createMutation = useCreateCopywriterCopy();

  useEffect(() => {
    setIsAnyEditing(editingCell !== null || newRow !== null);
  }, [editingCell, newRow]);

  useEffect(() => {
    if (addingNewRow && !newRow) {
      setNewRow({
        entity: "",
        campaigns: [],
        element_type: "headline",
        content_en: "",
        content_ar: "",
        content_es: "",
        content_az: "",
        char_limit_en: null,
        char_limit_ar: null,
        char_limit_es: null,
        char_limit_az: null,
      });
      setTimeout(() => {
        newRowEnglishRef.current?.focus();
      }, 100);
    }
  }, [addingNewRow, newRow]);

  const handleCancelNewRow = () => {
    setNewRow(null);
    onNewRowComplete();
  };

  const handleSaveNewRow = async () => {
    if (!newRow) return;

    if (!newRow.content_en.trim()) {
      toast({ title: "English content is required", variant: "destructive" });
      return;
    }

    try {
      await createMutation.mutateAsync({
        entity: newRow.entity ? [newRow.entity] : [],
        campaigns: newRow.campaigns,
        element_type: newRow.element_type,
        platform: [],
        content_en: newRow.content_en,
        content_ar: newRow.content_ar,
        content_es: newRow.content_es,
        content_az: newRow.content_az,
        char_limit_en: newRow.char_limit_en,
        char_limit_ar: newRow.char_limit_ar,
        char_limit_es: newRow.char_limit_es,
        char_limit_az: newRow.char_limit_az,
        tags: [],
        region: "",
      });
      setNewRow(null);
      onNewRowComplete();
      onRefresh?.();
      toast({ title: "Copy created successfully" });
    } catch (error) {
      toast({ title: "Failed to create copy", variant: "destructive" });
    }
  };

  const handleUpdateField = async (id: string, field: string, value: any) => {
    try {
      await updateMutation.mutateAsync({
        id,
        updates: { [field]: value },
      });
      onRefresh?.();
    } catch (error) {
      toast({ title: "Failed to update copy", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      onRefresh?.();
      toast({ title: "Copy deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete copy", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selected.map((id) => deleteMutation.mutateAsync(id)));
      setSelected([]);
      onRefresh?.();
      toast({ title: `${selected.length} copies deleted` });
    } catch (error) {
      toast({ title: "Failed to delete copies", variant: "destructive" });
    }
  };

  const handleSync = async (copy: CopywriterCopy) => {
    try {
      const languagesToSync = activeLanguages.filter((lang) => {
        const content = copy[`content_${lang}` as keyof CopywriterCopy];
        return content && typeof content === "string" && content.trim() !== "";
      }) as ("en" | "ar" | "az" | "es")[];

      await syncCopyToPlanners({ copy, languages: languagesToSync });
      toast({ title: "Copy synced to planners" });
    } catch (error) {
      toast({ title: "Failed to sync copy", variant: "destructive" });
    }
  };

  const toggleSelectAll = () => {
    if (selected.length === copies.length) {
      setSelected([]);
    } else {
      setSelected(copies.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getCharCount = (content: string): number => {
    const div = document.createElement("div");
    div.innerHTML = content;
    return div.textContent?.length || 0;
  };

  const getStatusBadge = (count: number, limit: number | null) => {
    if (!limit) return null;
    const diff = limit - count;
    if (diff < 0) {
      return <Badge variant="destructive" className="text-xs">Over by {Math.abs(diff)}</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{diff} left</Badge>;
  };

  const renderLanguageColumns = (copy: CopywriterCopy | null, lang: string, isNewRow: boolean = false) => {
    const contentKey = `content_${lang}` as keyof CopywriterCopy;
    const limitKey = `char_limit_${lang}` as keyof CopywriterCopy;
    const content = isNewRow && newRow ? newRow[contentKey as keyof NewRowData] as string : (copy?.[contentKey] as string || "");
    const limit = isNewRow && newRow ? newRow[limitKey as keyof NewRowData] as number | null : (copy?.[limitKey] as number | null);
    const count = getCharCount(content);
    const cellId = isNewRow ? `new-${lang}` : `${copy?.id}-${lang}`;
    const isEditing = editingCell === cellId;

    return (
      <>
        <TableCell className={cn("h-[44px] border-r p-2", lang === "ar" && "text-right")}>
          {isEditing ? (
            <RichTextEditor
              value={content}
              onChange={(val) => {
                if (isNewRow && newRow) {
                  setNewRow({ ...newRow, [contentKey]: val });
                } else if (copy) {
                  handleUpdateField(copy.id, contentKey, val);
                }
              }}
              minHeight="32px"
              className="text-xs"
              onBlur={() => setEditingCell(null)}
              autoFocus
            />
          ) : (
            <div
              className={cn(
                "text-xs cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 min-h-[32px]",
                "line-clamp-2 overflow-hidden",
                !content && "text-muted-foreground italic"
              )}
              onClick={() => !isGuest && setEditingCell(cellId)}
              dangerouslySetInnerHTML={{ __html: content || (lang === "en" ? "Click to edit..." : "") }}
            />
          )}
        </TableCell>
        <TableCell className="h-[44px] border-r p-2 text-center">
          <span className={cn("text-xs font-mono", count > (limit || Infinity) && "text-destructive font-semibold")}>
            {count}
          </span>
        </TableCell>
        <TableCell className="h-[44px] border-r p-2">
          <Input
            type="number"
            value={limit ?? ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : parseInt(e.target.value);
              if (isNewRow && newRow) {
                setNewRow({ ...newRow, [limitKey]: val });
              } else if (copy) {
                handleUpdateField(copy.id, limitKey, val);
              }
            }}
            className="h-7 text-xs text-center border-0"
            placeholder="-"
            disabled={isGuest}
          />
        </TableCell>
        <TableCell className="h-[44px] border-r p-2">
          {getStatusBadge(count, limit)}
        </TableCell>
      </>
    );
  };

  const allLanguages = ["en", "ar", ...activeLanguages.filter((l) => l !== "en" && l !== "ar")];
  const totalWidth = 50 + 100 + 140 + 100 + allLanguages.length * 530 + 100;

  return (
    <div className="space-y-4">
      {selected.length > 0 && !isGuest && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{selected.length} selected</span>
          <ConfirmPopover
            open={confirmBulkDelete}
            onOpenChange={setConfirmBulkDelete}
            onConfirm={handleBulkDelete}
            title={`Delete ${selected.length} copies?`}
            description="This action cannot be undone."
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Selected
              </Button>
            }
          />
        </div>
      )}

      <div className="border rounded-lg overflow-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
        <Table style={{ width: `${totalWidth}px`, tableLayout: "fixed" }}>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className="border-b-2">
              <TableHead className="h-10 w-[50px] border-r">
                <Checkbox
                  checked={selected.length === copies.length && copies.length > 0}
                  onCheckedChange={toggleSelectAll}
                  disabled={isGuest}
                />
              </TableHead>
              <TableHead className="h-10 w-[100px] border-r text-xs font-semibold">Entity</TableHead>
              <TableHead className="h-10 w-[140px] border-r text-xs font-semibold">Campaign</TableHead>
              <TableHead className="h-10 w-[100px] border-r text-xs font-semibold">Type</TableHead>
              {allLanguages.map((lang) => (
                <>
                  <TableHead key={`${lang}-content`} className="h-10 w-[250px] border-r text-xs font-semibold">
                    {LANGUAGE_LABELS[lang]}
                  </TableHead>
                  <TableHead key={`${lang}-count`} className="h-10 w-[60px] border-r text-xs font-semibold text-center">
                    Count
                  </TableHead>
                  <TableHead key={`${lang}-limit`} className="h-10 w-[80px] border-r text-xs font-semibold text-center">
                    Limit
                  </TableHead>
                  <TableHead key={`${lang}-status`} className="h-10 w-[140px] border-r text-xs font-semibold">
                    Status
                  </TableHead>
                </>
              ))}
              <TableHead className="h-10 w-[100px] text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newRow && (
              <TableRow className="h-[44px] border-b bg-primary/5">
                <TableCell className="h-[44px] border-r" />
                <TableCell className="h-[44px] border-r p-2">
                  <Select value={newRow.entity} onValueChange={(v) => setNewRow({ ...newRow, entity: v })}>
                    <SelectTrigger className="h-8 text-xs border-0">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITIES.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="h-[44px] border-r p-2">
                  <CampaignsTagsInput
                    value={newRow.campaigns}
                    onChange={(v) => setNewRow({ ...newRow, campaigns: v })}
                  />
                </TableCell>
                <TableCell className="h-[44px] border-r p-2">
                  <Select value={newRow.element_type} onValueChange={(v) => setNewRow({ ...newRow, element_type: v })}>
                    <SelectTrigger className="h-8 text-xs border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ELEMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                {allLanguages.map((lang) => renderLanguageColumns(null, lang, true))}
                <TableCell className="h-[44px] p-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2"
                      onClick={handleSaveNewRow}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveNewRow();
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          handleCancelNewRow();
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2"
                      onClick={handleCancelNewRow}
                    >
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {copies.length === 0 && !newRow ? (
              <TableRow>
                <TableCell colSpan={4 + allLanguages.length * 4 + 1} className="text-center py-8 text-muted-foreground">
                  No copies found. Click "Add Row" to create one.
                </TableCell>
              </TableRow>
            ) : (
              copies.map((copy, idx) => (
                <TableRow
                  key={copy.id}
                  className={cn(
                    "h-[44px] border-b",
                    idx % 2 === 0 && "bg-muted/30",
                    isAnyEditing ? "transition-none" : "transition-colors hover:bg-muted/50"
                  )}
                >
                  <TableCell className="h-[44px] border-r">
                    <Checkbox
                      checked={selected.includes(copy.id)}
                      onCheckedChange={() => toggleSelect(copy.id)}
                      disabled={isGuest}
                    />
                  </TableCell>
                  <TableCell className="h-[44px] border-r p-2">
                    <Select
                      value={copy.entity[0] || ""}
                      onValueChange={(v) => handleUpdateField(copy.id, "entity", [v])}
                      disabled={isGuest}
                    >
                      <SelectTrigger className="h-8 text-xs border-0">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITIES.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="h-[44px] border-r p-2">
                    <div className="flex flex-wrap gap-1 max-h-[40px] overflow-hidden">
                      {copy.campaigns.slice(0, 2).map((c) => (
                        <Badge key={c} variant="outline" className="text-xs px-1 py-0">
                          {c}
                        </Badge>
                      ))}
                      {copy.campaigns.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          +{copy.campaigns.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="h-[44px] border-r p-2">
                    <Select
                      value={copy.element_type}
                      onValueChange={(v) => handleUpdateField(copy.id, "element_type", v)}
                      disabled={isGuest}
                    >
                      <SelectTrigger className="h-8 text-xs border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ELEMENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {allLanguages.map((lang) => renderLanguageColumns(copy, lang, false))}
                  <TableCell className="h-[44px] p-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleSync(copy)}
                        disabled={isGuest}
                        title="Sync to planners"
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
                      <ConfirmPopover
                        open={confirmDelete === copy.id}
                        onOpenChange={(open) => setConfirmDelete(open ? copy.id : null)}
                        onConfirm={() => handleDelete(copy.id)}
                        title="Delete this copy?"
                        description="This action cannot be undone."
                        trigger={
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            disabled={isGuest}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
