import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Grid3x3, List, Download } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ENTITIES } from '@/lib/constants';
import { format } from 'date-fns';
import { useSocialAdElements } from '@/hooks/useSocialAdElements';

interface SavedElementsLibraryProps {
  platform: string;
  onElementSelect: (element: any) => void;
}

export function SavedElementsLibrary({ platform, onElementSelect }: SavedElementsLibraryProps) {
  const [activeTab, setActiveTab] = useState<'headline' | 'primary_text' | 'description'>('headline');
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const debouncedSearch = useDebouncedValue(search, 500);
  
  const { data: elements, isLoading } = useSocialAdElements(
    activeTab,
    debouncedSearch,
    entityFilter === 'all' ? undefined : entityFilter,
    languageFilter
  );

  const exportToCSV = () => {
    if (!elements || elements.length === 0) return;
    const headers = ['Type', 'Content', 'Entity', 'Language', 'Created'];
    const rows = elements.map(el => [
      activeTab, el.content || '', el.entity?.join('; ') || '', el.language || 'EN',
      format(new Date(el.created_at), 'yyyy-MM-dd')
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Saved Elements Library</h2>
        <div className="flex gap-2">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v: any) => v && setViewMode(v)}>
            <ToggleGroupItem value="grid"><Grid3x3 className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="table"><List className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={!elements?.length}>
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {ENTITIES.map((ent) => <SelectItem key={ent} value={ent}>{ent}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Language" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="EN">English</SelectItem>
            <SelectItem value="AR">العربية</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search elements..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="headline">Headlines</TabsTrigger>
          <TabsTrigger value="primary_text">Primary Text</TabsTrigger>
          <TabsTrigger value="description">Descriptions</TabsTrigger>
        </TabsList>

        {['headline', 'primary_text', 'description'].map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : elements && elements.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {elements.map((element) => (
                    <Card key={element.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onElementSelect(element)}>
                      <p className="text-sm mb-3 line-clamp-3">{element.content}</p>
                      <div className="flex flex-wrap gap-1">
                        {element.entity?.map((e: string) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                        <Badge variant="secondary" className="text-xs">{element.language || 'EN'}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-semibold">Content</th>
                        <th className="text-left p-3 font-semibold">Entity</th>
                        <th className="text-left p-3 font-semibold">Language</th>
                        <th className="text-left p-3 font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {elements.map((element) => (
                        <tr key={element.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => onElementSelect(element)}>
                          <td className="p-3 max-w-md truncate">{element.content}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {element.entity?.map((e: string) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                            </div>
                          </td>
                          <td className="p-3"><Badge variant="secondary">{element.language || 'EN'}</Badge></td>
                          <td className="p-3 text-sm text-muted-foreground">{format(new Date(element.created_at), 'MMM d, yyyy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No {type.replace('_', ' ')}s found</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
