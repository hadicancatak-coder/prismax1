import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { TechStackPage } from "@/hooks/useTechStackPages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Server, Database, Cloud, Code, Shield, Zap, Globe, Box, Cpu, HardDrive } from "lucide-react";

const ICON_OPTIONS = [
  { value: "server", label: "Server", icon: Server },
  { value: "database", label: "Database", icon: Database },
  { value: "cloud", label: "Cloud", icon: Cloud },
  { value: "code", label: "Code", icon: Code },
  { value: "shield", label: "Security", icon: Shield },
  { value: "zap", label: "Performance", icon: Zap },
  { value: "globe", label: "Web", icon: Globe },
  { value: "box", label: "Package", icon: Box },
  { value: "cpu", label: "Processing", icon: Cpu },
  { value: "hard-drive", label: "Storage", icon: HardDrive },
];

interface TechStackPageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: TechStackPage | null;
  parentId?: string | null;
  allPages: TechStackPage[];
  onSave: (data: { title: string; content: string; parent_id: string | null; icon: string }) => void;
  isLoading?: boolean;
}

export function TechStackPageEditor({
  open,
  onOpenChange,
  page,
  parentId,
  allPages,
  onSave,
  isLoading,
}: TechStackPageEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [icon, setIcon] = useState("server");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    (async () => {
      // Create mode
      if (!page?.id) {
        setTitle("");
        setContent("");
        setSelectedParentId(parentId || null);
        setIcon("server");
        return;
      }

      // Edit mode: always fetch authoritative data by id
      const { data, error } = await supabase
        .from("tech_stack_pages")
        .select("title, content, parent_id, icon")
        .eq("id", page.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        toast.error("Failed to load content");
        setTitle(page.title || "");
        setContent(page.content || "");
        setSelectedParentId(page.parent_id || null);
        setIcon(page.icon || "server");
        return;
      }

      setTitle(data.title || "");
      setContent(data.content || "");
      setSelectedParentId(data.parent_id || null);
      setIcon(data.icon || "server");
    })();

    return () => {
      cancelled = true;
    };
  }, [open, page?.id, parentId]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      content,
      parent_id: selectedParentId,
      icon,
    });
  };

  // Filter out current page and its descendants from parent options
  const getDescendantIds = (pageId: string): string[] => {
    const descendants: string[] = [pageId];
    const findChildren = (id: string) => {
      allPages.filter(p => p.parent_id === id).forEach(child => {
        descendants.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(pageId);
    return descendants;
  };

  const excludedIds = page ? getDescendantIds(page.id) : [];
  const parentOptions = allPages.filter(p => !excludedIds.includes(p.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page ? "Edit Tech Stack Item" : "Add Tech Stack Item"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-[1fr_120px] gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Supabase, React, Tailwind CSS..."
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={selectedParentId || "none"}
              onValueChange={(v) => setSelectedParentId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No category (root item)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category (root item)</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Details</Label>
            <p className="text-metadata text-muted-foreground">
              Include: What it is, Why we use it, Who uses it, Who is responsible, Issues, Future plans
            </p>
            <div className="border border-border rounded-lg overflow-hidden min-h-[300px]">
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Describe the technology, its purpose, and relevant details..."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isLoading}>
            {page ? "Save Changes" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
