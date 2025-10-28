import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { CopyCard } from "@/components/copywriter/CopyCard";
import { CreateCopyDialog } from "@/components/copywriter/CreateCopyDialog";
import {
  useCopywriterCopies,
  useDeleteCopywriterCopy,
  CopywriterCopy,
} from "@/hooks/useCopywriterCopies";
import { useAuth } from "@/hooks/useAuth";
import { syncCopyToPlanners } from "@/lib/copywriterSync";
import { useToast } from "@/hooks/use-toast";
import { ENTITIES } from "@/lib/constants";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const ELEMENT_TYPES = ["headline", "description", "primary_text", "callout", "sitelink"];
const PLATFORMS = ["ppc", "facebook", "instagram", "tiktok", "snap", "reddit", "whatsapp"];

function CopyWriter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<CopywriterCopy | null>(null);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: copies, isLoading } = useCopywriterCopies({
    platform: platformFilter !== "all" ? [platformFilter] : undefined,
    entity: entityFilter !== "all" ? [entityFilter] : undefined,
    elementType: typeFilter !== "all" ? typeFilter : undefined,
    search: debouncedSearch,
  });

  const deleteCopy = useDeleteCopywriterCopy();

  const handleEdit = (copy: CopywriterCopy) => {
    setEditingCopy(copy);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this copy?")) {
      await deleteCopy.mutateAsync(id);
    }
  };

  const handleSync = async (copy: CopywriterCopy) => {
    try {
      await syncCopyToPlanners({ copy });
      toast({ title: "Synced to planners successfully" });
    } catch (error: any) {
      toast({
        title: "Error syncing",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCopy(null);
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Copy Writer</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Copy
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search copies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Element Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ELEMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {ENTITIES.map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading copies...</div>
        ) : !copies || copies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No copies found. Create your first copy!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">English (EN)</h2>
              {copies.map((copy) => (
                <CopyCard
                  key={copy.id}
                  copy={copy}
                  content={copy.content_en}
                  language="en"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSync={handleSync}
                  isOwner={user?.id === copy.created_by}
                  isAdmin={user?.role === "admin"}
                />
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Arabic (AR)</h2>
              {copies.map((copy) => (
                <CopyCard
                  key={copy.id}
                  copy={copy}
                  content={copy.content_ar}
                  language="ar"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSync={handleSync}
                  isOwner={user?.id === copy.created_by}
                  isAdmin={user?.role === "admin"}
                />
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Azerbaijani (AZ)</h2>
              {copies.map((copy) => (
                <CopyCard
                  key={copy.id}
                  copy={copy}
                  content={copy.content_az}
                  language="az"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSync={handleSync}
                  isOwner={user?.id === copy.created_by}
                  isAdmin={user?.role === "admin"}
                />
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Spanish (ES)</h2>
              {copies.map((copy) => (
                <CopyCard
                  key={copy.id}
                  copy={copy}
                  content={copy.content_es}
                  language="es"
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSync={handleSync}
                  isOwner={user?.id === copy.created_by}
                  isAdmin={user?.role === "admin"}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateCopyDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editingCopy={editingCopy}
      />
    </>
  );
}

export default CopyWriter;
