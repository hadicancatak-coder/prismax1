import { useState, useMemo } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import { PageContainer, PageHeader, DataCard, EmptyState } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KnowledgeTree } from "@/components/knowledge/KnowledgeTree";
import { KnowledgePageEditor } from "@/components/knowledge/KnowledgePageEditor";
import { KnowledgePageContent } from "@/components/knowledge/KnowledgePageContent";
import { useKnowledgePages, KnowledgePage } from "@/hooks/useKnowledgePages";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Knowledge() {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const { pages, pageTree, isLoading, createPage, updatePage, deletePage } = useKnowledgePages();

  const [selectedPage, setSelectedPage] = useState<KnowledgePage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<KnowledgePage | null>(null);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<KnowledgePage | null>(null);

  // Filter pages for search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return pageTree;
    
    const query = searchQuery.toLowerCase();
    const filterPages = (pages: KnowledgePage[]): KnowledgePage[] => {
      return pages
        .map(page => ({
          ...page,
          children: page.children ? filterPages(page.children) : [],
        }))
        .filter(page => 
          page.title.toLowerCase().includes(query) ||
          page.content?.toLowerCase().includes(query) ||
          (page.children && page.children.length > 0)
        );
    };
    
    return filterPages(pageTree);
  }, [pageTree, searchQuery]);

  // Build breadcrumbs for selected page
  const breadcrumbs = useMemo(() => {
    if (!selectedPage || !pages) return [];
    
    const crumbs: KnowledgePage[] = [];
    let currentId = selectedPage.parent_id;
    
    while (currentId) {
      const parent = pages.find(p => p.id === currentId);
      if (parent) {
        crumbs.unshift(parent);
        currentId = parent.parent_id;
      } else {
        break;
      }
    }
    
    crumbs.push(selectedPage);
    return crumbs;
  }, [selectedPage, pages]);

  const handleCreatePage = (parentId: string | null) => {
    setEditingPage(null);
    setCreateParentId(parentId);
    setEditorOpen(true);
  };

  const handleEditPage = () => {
    if (selectedPage) {
      setEditingPage(selectedPage);
      setCreateParentId(null);
      setEditorOpen(true);
    }
  };

  const handleDeletePage = () => {
    if (selectedPage) {
      setPageToDelete(selectedPage);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (pageToDelete) {
      deletePage.mutate(pageToDelete.id);
      setSelectedPage(null);
      setPageToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSave = (data: { title: string; content: string; parent_id: string | null; icon: string }) => {
    if (editingPage) {
      updatePage.mutate({ id: editingPage.id, ...data }, {
        onSuccess: (updatedPage) => {
          setSelectedPage(updatedPage as KnowledgePage);
          setEditorOpen(false);
        },
      });
    } else {
      createPage.mutate(data, {
        onSuccess: (newPage) => {
          setSelectedPage(newPage as KnowledgePage);
          setEditorOpen(false);
        },
      });
    }
  };

  const handleNavigate = (page: KnowledgePage) => {
    if (page.id) {
      // Find the full page object from pages array to ensure we have children
      const fullPage = pages?.find(p => p.id === page.id);
      if (fullPage) {
        // Also attach children from pageTree
        const findWithChildren = (tree: KnowledgePage[]): KnowledgePage | undefined => {
          for (const node of tree) {
            if (node.id === page.id) return node;
            if (node.children) {
              const found = findWithChildren(node.children);
              if (found) return found;
            }
          }
          return undefined;
        };
        const pageWithChildren = findWithChildren(pageTree);
        setSelectedPage(pageWithChildren || fullPage);
      }
    } else {
      setSelectedPage(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        icon={BookOpen}
        title="Knowledge Base"
        description="Documentation, processes, and guides"
        actions={
          isAdmin && (
            <Button onClick={() => handleCreatePage(null)} className="rounded-full px-6 h-10 gap-2">
              <Plus className="h-4 w-4" />
              New Page
            </Button>
          )
        }
      />

      <div className="grid grid-cols-[280px_1fr] gap-6 min-h-[600px]">
        {/* Sidebar */}
        <DataCard className="h-fit max-h-[calc(100vh-200px)] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar p-2">
            <KnowledgeTree
              pages={filteredTree}
              selectedPageId={selectedPage?.id || null}
              onSelectPage={handleNavigate}
              onCreatePage={isAdmin ? handleCreatePage : undefined}
              isAdmin={isAdmin}
            />
          </div>
        </DataCard>

        {/* Content */}
        <DataCard className="min-h-[600px]">
          {selectedPage ? (
            <KnowledgePageContent
              page={selectedPage}
              breadcrumbs={breadcrumbs.slice(0, -1)}
              onEdit={isAdmin ? handleEditPage : undefined}
              onDelete={isAdmin ? handleDeletePage : undefined}
              onNavigate={handleNavigate}
              isAdmin={isAdmin}
            />
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Welcome to Knowledge Base"
              description={
                pages && pages.length > 0
                  ? "Select a page from the sidebar to view its content."
                  : "Get started by creating your first page."
              }
              action={
                isAdmin && (!pages || pages.length === 0)
                  ? { label: "Create First Page", onClick: () => handleCreatePage(null) }
                  : undefined
              }
            />
          )}
        </DataCard>
      </div>

      {/* Editor Dialog */}
      <KnowledgePageEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        page={editingPage}
        parentId={createParentId}
        allPages={pages || []}
        onSave={handleSave}
        isLoading={createPage.isPending || updatePage.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pageToDelete?.title}"? This action cannot be undone.
              {pageToDelete?.children && pageToDelete.children.length > 0 && (
                <span className="block mt-2 text-warning">
                  Warning: This page has {pageToDelete.children.length} sub-page(s) that will become root pages.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
