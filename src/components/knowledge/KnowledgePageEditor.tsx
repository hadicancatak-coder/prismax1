import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { KnowledgePage } from "@/hooks/useKnowledgePages";
import { FileText, Book, Lightbulb, Link, Settings, Users, Folder, HelpCircle, CheckCircle } from "lucide-react";

const ICON_OPTIONS = [
  { value: "file-text", label: "Document", icon: FileText },
  { value: "book", label: "Book", icon: Book },
  { value: "lightbulb", label: "Idea", icon: Lightbulb },
  { value: "link", label: "Link", icon: Link },
  { value: "settings", label: "Settings", icon: Settings },
  { value: "users", label: "Team", icon: Users },
  { value: "folder", label: "Folder", icon: Folder },
  { value: "help-circle", label: "Help", icon: HelpCircle },
  { value: "check-circle", label: "Done", icon: CheckCircle },
];

interface KnowledgePageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: KnowledgePage | null;
  parentId?: string | null;
  allPages: KnowledgePage[];
  onSave: (data: { title: string; content: string; parent_id: string | null; icon: string }) => void;
  isLoading?: boolean;
}

export function KnowledgePageEditor({
  open,
  onOpenChange,
  page,
  parentId,
  allPages,
  onSave,
  isLoading,
}: KnowledgePageEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [icon, setIcon] = useState("file-text");

  useEffect(() => {
    if (open) {
      if (page) {
        setTitle(page.title);
        setContent(page.content || "");
        setSelectedParentId(page.parent_id);
        setIcon(page.icon || "file-text");
      } else {
        setTitle("");
        setContent("");
        setSelectedParentId(parentId || null);
        setIcon("file-text");
      }
    }
  }, [open, page, parentId]);

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
          <DialogTitle>{page ? "Edit Page" : "Create Page"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-[1fr_120px] gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page title..."
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
            <Label>Parent Page</Label>
            <Select
              value={selectedParentId || "none"}
              onValueChange={(v) => setSelectedParentId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No parent (root page)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent (root page)</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <div className="border border-border rounded-lg overflow-hidden min-h-[300px]">
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your page content here..."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isLoading}>
            {page ? "Save Changes" : "Create Page"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
