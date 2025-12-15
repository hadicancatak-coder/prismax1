import { KnowledgePage } from "@/hooks/useKnowledgePages";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import * as LucideIcons from "lucide-react";
import { FileText } from "lucide-react";

interface KnowledgePageContentProps {
  page: KnowledgePage;
  breadcrumbs: KnowledgePage[];
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate?: (page: KnowledgePage) => void;
  isAdmin?: boolean;
}

export function KnowledgePageContent({
  page,
  breadcrumbs,
  onEdit,
  onDelete,
  onNavigate,
  isAdmin,
}: KnowledgePageContentProps) {
  // Get icon component
  const iconName = page.icon || 'file-text';
  const IconComponent = (LucideIcons as any)[iconName.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('')] || FileText;

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
        {breadcrumbs.map((crumb, index) => (
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
          <div>
            <h1 className="text-heading-lg font-semibold text-foreground">{page.title}</h1>
            <p className="text-metadata text-muted-foreground mt-1">
              Last updated {format(new Date(page.updated_at), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
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
