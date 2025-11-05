import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { SavedCopiesTableView } from "@/components/copywriter/SavedCopiesTableView";
import { LanguageColumnToggle } from "@/components/copywriter/LanguageColumnToggle";
import {
  useCopywriterCopies,
  CopywriterCopy,
} from "@/hooks/useCopywriterCopies";
import { useQueryClient } from "@tanstack/react-query";
import { ENTITIES } from "@/lib/constants";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

const ELEMENT_TYPES = ["headline", "description", "primary_text", "callout", "sitelink"];
const PLATFORMS = ["ppc", "facebook", "instagram", "tiktok", "snap", "reddit", "whatsapp"];

function CopyWriter() {
  const queryClient = useQueryClient();
  const [addingNewRow, setAddingNewRow] = useState(false);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeLanguages, setActiveLanguages] = useState<string[]>(["en", "ar"]);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: copies, isLoading } = useCopywriterCopies({
    platform: platformFilter !== "all" ? [platformFilter] : undefined,
    entity: entityFilter !== "all" ? [entityFilter] : undefined,
    elementType: typeFilter !== "all" ? typeFilter : undefined,
    search: debouncedSearch,
  });

  const handleAddRow = () => {
    setAddingNewRow(true);
  };

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-8 space-y-6 lg:space-y-8 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Copy Writer</h1>
            <p className="text-muted-foreground mt-1">Manage and organize your marketing copy</p>
          </div>
          <div className="flex gap-2">
            <LanguageColumnToggle
              activeLanguages={activeLanguages}
              onToggle={setActiveLanguages}
            />
            <Button onClick={handleAddRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap border-b border-border pb-4">
          <div className="relative flex-1 w-full sm:max-w-sm min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search copies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 min-h-[44px] w-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px] min-h-[44px]">
              <SelectValue placeholder="Type" />
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
            <SelectTrigger className="w-full sm:w-[140px] min-h-[44px]">
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
            <SelectTrigger className="w-full sm:w-[140px] min-h-[44px]">
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
        </div>

        {isLoading ? (
          <TableSkeleton columns={6} rows={10} />
        ) : (
          <SavedCopiesTableView
            copies={copies || []} 
            activeLanguages={activeLanguages}
            addingNewRow={addingNewRow}
            onNewRowComplete={() => setAddingNewRow(false)}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["copywriter-copies"] })}
          />
        )}
      </div>
    </>
  );
}

export default CopyWriter;
