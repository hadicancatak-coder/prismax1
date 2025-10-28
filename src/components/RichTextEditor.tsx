import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Pencil, Link as LinkIcon, ExternalLink } from "lucide-react";
import { parseMarkdownLinks, insertMarkdownLink, removeMarkdownLink, updateMarkdownLink } from "@/lib/markdownParser";
import { LinkPopover } from "@/components/LinkPopover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface RichTextEditorProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({ value, onSave, className = "", disabled = false }: RichTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue.trim() === "") {
      setEditValue(value);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
      toast({ title: "Failed to save changes", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "k" && e.ctrlKey) {
      e.preventDefault();
      handleInsertLinkClick();
    }
  };

  const handleInsertLinkClick = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start === end) {
      toast({ title: "Please select text first", variant: "destructive" });
      return;
    }
    
    setShowLinkDialog(true);
  };

  const handleInsertLink = () => {
    if (!textareaRef.current || !linkUrl.trim()) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    const newContent = insertMarkdownLink(editValue, start, end, linkUrl);
    setEditValue(newContent);
    setLinkUrl("");
    setShowLinkDialog(false);
    toast({ title: "Link inserted" });
  };

  const handleEditLink = (linkIndex: number, newUrl: string, newText: string) => {
    const newContent = updateMarkdownLink(value, linkIndex, newUrl, newText);
    onSave(newContent);
  };

  const handleRemoveLink = (linkIndex: number) => {
    const newContent = removeMarkdownLink(value, linkIndex);
    onSave(newContent);
    toast({ title: "Link removed" });
  };

  const renderContent = () => {
    const segments = parseMarkdownLinks(value);
    let linkIndex = 0;

    return segments.map((segment, i) => {
      if (segment.type === 'link') {
        const currentLinkIndex = linkIndex++;
        return (
          <LinkPopover
            key={i}
            text={segment.content}
            url={segment.url || ''}
            linkIndex={currentLinkIndex}
            onEdit={handleEditLink}
            onRemove={handleRemoveLink}
          >
            <a
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
              onClick={(e) => {
                // Allow link to be clicked normally, popover will show on hover
                e.stopPropagation();
              }}
            >
              {segment.content}
              <ExternalLink className="h-3 w-3" />
            </a>
          </LinkPopover>
        );
      }
      return <span key={i}>{segment.content}</span>;
    });
  };

  if (disabled) {
    return <span className={className}>{value || "—"}</span>;
  }

  if (!isEditing) {
    return (
      <button
        disabled={disabled || isSaving}
        onClick={() => setIsEditing(true)}
        className={`inline-flex items-start gap-2 hover:bg-accent/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors group text-left w-full ${className}`}
      >
        <span className="flex-1">{value ? renderContent() : "—"}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0 mt-0.5" />
      </button>
    );
  }

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="min-h-[100px]"
            placeholder="Enter text... Use [text](url) for links or Ctrl+K"
          />
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleInsertLinkClick}
              disabled={isSaving}
              title="Insert link (Ctrl+K)"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleInsertLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowLinkDialog(false);
              setLinkUrl("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleInsertLink} disabled={!linkUrl.trim()}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
