import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { LinkTooltip } from "@/components/LinkTooltip";
import { EditLinkDialog } from "@/components/EditLinkDialog";
import { parseMarkdownLinks, insertMarkdownLink, updateMarkdownLink, removeMarkdownLink } from "@/lib/markdownParser";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InlineRichTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  dir?: "ltr" | "rtl";
  readOnly?: boolean;
  minHeight?: string;
  maxLength?: number;
}

export function InlineRichTextField({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  disabled,
  autoFocus,
  dir = "ltr",
  readOnly = false,
  minHeight = "60px",
  maxLength,
}: InlineRichTextFieldProps) {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<{ index: number; text: string; url: string } | null>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const urlRegex = /^https?:\/\/.+/;

    if (urlRegex.test(pastedText) && textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;

      if (start !== end) {
        e.preventDefault();
        const newContent = insertMarkdownLink(value, start, end, pastedText);
        onChange(newContent);
        toast({ title: "Link created from pasted URL" });
      }
    }
  };

  const handleEditLink = (linkIndex: number) => {
    const segments = parseMarkdownLinks(value);
    const links = segments.filter(s => s.type === 'link');
    const link = links[linkIndex];
    
    if (link) {
      setEditingLink({ 
        index: linkIndex, 
        text: link.content, 
        url: link.url || '' 
      });
      setShowEditDialog(true);
    }
  };

  const handleSaveEditedLink = (newUrl: string, newText: string) => {
    if (editingLink !== null) {
      const newContent = updateMarkdownLink(value, editingLink.index, newUrl, newText);
      onChange(newContent);
      setShowEditDialog(false);
      setEditingLink(null);
    }
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
  };

  const handleRemoveLink = (linkIndex: number) => {
    const newContent = removeMarkdownLink(value, linkIndex);
    onChange(newContent);
    toast({ title: "Link removed" });
  };

  const renderContent = () => {
    const segments = parseMarkdownLinks(value);
    let linkIndex = 0;

    return segments.map((segment, i) => {
      if (segment.type === 'link') {
        const currentLinkIndex = linkIndex;
        linkIndex++;
        
        return (
          <LinkTooltip
            key={i}
            url={segment.url || ''}
            onEdit={() => handleEditLink(currentLinkIndex)}
            onCopy={() => handleCopyUrl(segment.url || '')}
            onRemove={() => handleRemoveLink(currentLinkIndex)}
          >
            <a
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline cursor-pointer"
              onClick={(e) => {
                // Let the link open naturally
              }}
            >
              {segment.content}
            </a>
          </LinkTooltip>
        );
      }
      return <span key={i}>{segment.content}</span>;
    });
  };

  if (readOnly) {
    return (
      <>
        <div 
          className={cn("whitespace-pre-wrap text-sm", className)}
          dir={dir}
          style={{ minHeight }}
        >
          {value ? renderContent() : (
            <span className="text-muted-foreground italic">{placeholder || "Click to add"}</span>
          )}
        </div>
        {editingLink && (
          <EditLinkDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            text={editingLink.text}
            url={editingLink.url}
            onSave={handleSaveEditedLink}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        dir={dir}
        maxLength={maxLength}
        style={{ minHeight }}
      />
      {editingLink && (
        <EditLinkDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          text={editingLink.text}
          url={editingLink.url}
          onSave={handleSaveEditedLink}
        />
      )}
    </>
  );
}
