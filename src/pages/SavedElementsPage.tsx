import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { Search, Copy, Edit, Trash2, Star } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function SavedElementsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get unique entities from ad_elements
  const { data: entityOptions } = useQuery({
    queryKey: ['element-entities'],
    queryFn: async () => {
      const { data } = await supabase.from('ad_elements').select('entity');
      const allEntities = data?.flatMap(el => el.entity || []) || [];
      return [...new Set(allEntities)].filter(Boolean).sort();
    }
  });

  // Query ad_elements table - THIS IS WHERE YOUR SAVED ELEMENTS ARE! 🎯
  const { data: savedElements = [] } = useQuery({
    queryKey: ['saved-elements', typeFilter, entityFilter],
    queryFn: async () => {
      let query = supabase.from('ad_elements').select('*');
      
      // Filter by element type
      if (typeFilter !== 'all') {
        query = query.eq('element_type', typeFilter);
      }
      
      // Filter by entity (array contains check)
      if (entityFilter !== 'all') {
        query = query.contains('entity', [entityFilter]);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Filter elements by search query
  const filteredElements = savedElements.filter(el =>
    searchQuery === '' || 
    (typeof el.content === 'string' && el.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group elements by type
  const elementsByType = {
    headline: filteredElements.filter(el => el.element_type === 'headline'),
    description: filteredElements.filter(el => el.element_type === 'description'),
    sitelink: filteredElements.filter(el => el.element_type === 'sitelink'),
    callout: filteredElements.filter(el => el.element_type === 'callout'),
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ad_elements').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete element');
      return;
    }
    toast.success('Element deleted successfully');
    queryClient.invalidateQueries({ queryKey: ['saved-elements'] });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const getApprovalBadge = (status: string) => {
    const variants: Record<string, { variant: any, text: string }> = {
      approved: { variant: 'default', text: 'Approved' },
      pending: { variant: 'secondary', text: 'Pending' },
      rejected: { variant: 'destructive', text: 'Rejected' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Elements Library</h1>
          <p className="text-muted-foreground">Manage and reuse your saved campaigns, ad groups, and ads</p>
        </div>
        
        <Tabs value="library" className="w-auto">
          <TabsList>
            <TabsTrigger value="search" asChild>
              <Link to="/ads/search">Search</Link>
            </TabsTrigger>
            <TabsTrigger value="display" asChild>
              <Link to="/ads/display">Display</Link>
            </TabsTrigger>
            <TabsTrigger value="library" asChild>
              <Link to="/ads/library">Library</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={typeFilter === 'all'} onCheckedChange={() => setTypeFilter('all')} />
                  <label className="text-sm">All Types</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={typeFilter === 'headline'} onCheckedChange={() => setTypeFilter('headline')} />
                  <label className="text-sm">Headlines</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={typeFilter === 'description'} onCheckedChange={() => setTypeFilter('description')} />
                  <label className="text-sm">Descriptions</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={typeFilter === 'sitelink'} onCheckedChange={() => setTypeFilter('sitelink')} />
                  <label className="text-sm">Sitelinks</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={typeFilter === 'callout'} onCheckedChange={() => setTypeFilter('callout')} />
                  <label className="text-sm">Callouts</label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entityOptions?.map(entity => (
                    <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Approval Status</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={approvalFilter === 'all'} onCheckedChange={() => setApprovalFilter('all')} />
                  <label className="text-sm">All</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={approvalFilter === 'approved'} onCheckedChange={() => setApprovalFilter('approved')} />
                  <label className="text-sm">Approved</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={approvalFilter === 'pending'} onCheckedChange={() => setApprovalFilter('pending')} />
                  <label className="text-sm">Pending</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={approvalFilter === 'rejected'} onCheckedChange={() => setApprovalFilter('rejected')} />
                  <label className="text-sm">Rejected</label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="col-span-9 space-y-4">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search saved elements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
          </Card>

          {(typeFilter === 'all' || typeFilter === 'headline') && elementsByType.headline.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Headlines ({elementsByType.headline.length})</h3>
              <div className="grid grid-cols-2 gap-4">
                {elementsByType.headline.map(element => (
                  <Card key={element.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{String(element.content)}</p>
                          {element.entity && Array.isArray(element.entity) && element.entity.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Entity: {(element.entity as string[]).join(', ')}
                            </p>
                          )}
                          {element.google_status && (
                            <Badge variant="outline" className="mt-2">{element.google_status}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => handleCopy(String(element.content))}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(element.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(typeFilter === 'all' || typeFilter === 'description') && elementsByType.description.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Descriptions ({elementsByType.description.length})</h3>
              <div className="grid grid-cols-2 gap-4">
                {elementsByType.description.map(element => (
                  <Card key={element.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{String(element.content)}</p>
                          {element.entity && Array.isArray(element.entity) && element.entity.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Entity: {(element.entity as string[]).join(', ')}
                            </p>
                          )}
                          {element.google_status && (
                            <Badge variant="outline" className="mt-2">{String(element.google_status)}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => handleCopy(String(element.content))}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(element.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(typeFilter === 'all' || typeFilter === 'sitelink') && elementsByType.sitelink.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Sitelinks ({elementsByType.sitelink.length})</h3>
              <div className="grid grid-cols-2 gap-4">
                {elementsByType.sitelink.map(element => (
                  <Card key={element.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{String(element.content)}</p>
                          {element.entity && Array.isArray(element.entity) && element.entity.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Entity: {(element.entity as string[]).join(', ')}
                            </p>
                          )}
                          {element.google_status && (
                            <Badge variant="outline" className="mt-2">{String(element.google_status)}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => handleCopy(String(element.content))}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(element.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(typeFilter === 'all' || typeFilter === 'callout') && elementsByType.callout.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Callouts ({elementsByType.callout.length})</h3>
              <div className="grid grid-cols-2 gap-4">
                {elementsByType.callout.map(element => (
                  <Card key={element.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{String(element.content)}</p>
                          {element.entity && Array.isArray(element.entity) && element.entity.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Entity: {(element.entity as string[]).join(', ')}
                            </p>
                          )}
                          {element.google_status && (
                            <Badge variant="outline" className="mt-2">{String(element.google_status)}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => handleCopy(String(element.content))}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(element.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {Object.values(elementsByType).every(arr => arr.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No saved elements found. Start saving headlines, descriptions, sitelinks, and callouts from the Search or Display planners!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
