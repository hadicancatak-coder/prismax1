import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Upload } from 'lucide-react';
import { useAdElements } from '@/hooks/useAdElements';
import { ElementCard } from './ElementCard';
import { CreateElementDialog } from './CreateElementDialog';
import { BulkImportDialog } from './BulkImportDialog';
import { AdvancedFilters } from './AdvancedFilters';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function SavedElementsLibrary() {
  const [activeTab, setActiveTab] = useState<'headline' | 'description' | 'sitelink' | 'callout'>('headline');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  const debouncedSearch = useDebouncedValue(search, 500);
  
  const { data: elements, isLoading } = useAdElements({
    elementType: activeTab,
    search: debouncedSearch,
    ...filters,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Elements</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowBulkImport(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Element
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search elements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <AdvancedFilters onFiltersChange={setFilters} />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="headline">Headlines</TabsTrigger>
          <TabsTrigger value="description">Descriptions</TabsTrigger>
          <TabsTrigger value="sitelink">Sitelinks</TabsTrigger>
          <TabsTrigger value="callout">Callouts</TabsTrigger>
        </TabsList>

        {['headline', 'description', 'sitelink', 'callout'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4 mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : elements && elements.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {elements.map((element) => (
                  <ElementCard key={element.id} element={element} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">No {type}s saved yet</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateElementDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        elementType={activeTab}
      />
      
      <BulkImportDialog 
        open={showBulkImport} 
        onOpenChange={setShowBulkImport}
        elementType={activeTab}
      />
    </div>
  );
}
