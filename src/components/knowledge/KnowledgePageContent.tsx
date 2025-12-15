import { useState } from "react";
import { KnowledgePage } from "@/hooks/useKnowledgePages";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronRight, Share2, Copy, Check, Globe, Lock } from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import * as LucideIcons from "lucide-react";
import { FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getProductionUrl } from "@/lib/utils";

interface KnowledgePageContentProps {
  page: KnowledgePage;
  breadcrumbs: KnowledgePage[];
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate?: (page: KnowledgePage) => void;
  onTogglePublic?: (isPublic: boolean) => void;
  isAdmin?: boolean;
}

export function KnowledgePageContent({
  page,
  breadcrumbs,
  onEdit,
  onDelete,
  onNavigate,
  onTogglePublic,
  isAdmin,
}: KnowledgePageContentProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Get icon component
  const iconName = page.icon || 'file-text';
  const IconComponent = (LucideIcons as any)[iconName.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('')] || FileText;

  const publicUrl = page.public_token 
    ? `${getProductionUrl()}/knowledge/public/${page.public_token}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ title: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-body-sm text-muted-foreground mb-4">
        <button
          className="hover:text-foreground transition-colors"
          onClick={() => onNavigate?.({ id: '', title: 'Home' } as KnowledgePage)}
        >
          Knowledge
        </button>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <button
              className="hover:text-foreground transition-colors"
              onClick={() => onNavigate?.(crumb)}
            >
              {crumb.title}
            </button>
          </span>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-heading-lg font-semibold text-foreground">{page.title}</h1>
              <p className="text-metadata text-muted-foreground mt-1">
                Last updated {format(new Date(page.updated_at), "MMM d, yyyy")}
              </p>
            </div>
            {page.is_public && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/15 text-success text-metadata">
                <Globe className="h-3 w-3" />
                Public
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Share Button - available to all users */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                {/* Admin can toggle public/private */}
                {isAdmin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {page.is_public ? (
                        <Globe className="h-4 w-4 text-success" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Label htmlFor="public-toggle" className="font-medium">
                        {page.is_public ? "Public" : "Private"}
                      </Label>
                    </div>
                    <Switch
                      id="public-toggle"
                      checked={page.is_public || false}
                      onCheckedChange={(checked) => onTogglePublic?.(checked)}
                    />
                  </div>
                )}
                
                {/* Show link if public */}
                {page.is_public && publicUrl ? (
                  <div className="space-y-2">
                    <p className="text-metadata text-muted-foreground">
                      Anyone with the link can view this page without signing in.
                    </p>
                    <Label className="text-metadata">Share link</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={publicUrl}
                        className="text-body-sm"
                      />
                      <Button size="icon" variant="outline" onClick={handleCopyLink}>
                        {copied ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-metadata text-muted-foreground">
                    {isAdmin 
                      ? "Toggle the switch above to make this page public and generate a share link."
                      : "This page is private. Ask an admin to make it public for sharing."}
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Admin-only edit/delete buttons */}
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {page.content ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert 
              prose-headings:text-foreground prose-p:text-foreground 
              prose-strong:text-foreground prose-a:text-primary
              prose-li:text-foreground prose-code:text-primary
              prose-pre:bg-muted prose-pre:border prose-pre:border-border"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>This page is empty. Click Edit to add content.</p>
          </div>
        )}
      </div>

      {/* Child pages */}
      {page.children && page.children.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-heading-sm font-medium text-foreground mb-4">Sub-pages</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {page.children.map((child) => {
              const ChildIcon = (LucideIcons as any)[
                (child.icon || 'file-text').split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
              ] || FileText;
              
              return (
                <button
                  key={child.id}
                  onClick={() => onNavigate?.(child)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-smooth text-left"
                >
                  <ChildIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-body-sm font-medium truncate">{child.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
