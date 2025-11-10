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

  const { data: entities } = useQuery({
    queryKey: ['entity-presets-filter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('entity_presets').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: savedCampaigns = [] } = useQuery({
    queryKey: ['saved-campaigns', entityFilter],
    queryFn: async () => {
      let query = supabase.from('ad_campaigns').select('*').eq('is_template', true);
      if (entityFilter !== 'all') query = query.eq('entity', entityFilter);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: savedAdGroups = [] } = useQuery({
    queryKey: ['saved-ad-groups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ad_groups').select('*').eq('is_template', true).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: savedAds = [] } = useQuery({
    queryKey: ['saved-ads-library', entityFilter, approvalFilter],
    queryFn: async () => {
      let query = supabase.from('saved_ads_library').select('*');
      if (entityFilter !== 'all') query = query.eq('entity', entityFilter);
      if (approvalFilter !== 'all') query = query.eq('google_approval_status', approvalFilter);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const filteredCampaigns = savedCampaigns.filter(c => 
    (typeFilter === 'all' || typeFilter === 'campaign') &&
    (searchQuery === '' || c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredAdGroups = savedAdGroups.filter(ag =>
    (typeFilter === 'all' || typeFilter === 'ad_group') &&
    (searchQuery === '' || ag.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredAds = savedAds.filter(ad =>
    (typeFilter === 'all' || typeFilter === 'ad') &&
    (searchQuery === '' || ad.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (type: string, id: string) => {
    const table = type === 'campaign' ? 'ad_campaigns' : type === 'ad_group' ? 'ad_groups' : 'saved_ads_library';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      toast.error(`Failed to delete ${type}`);
      return;
    }
    toast.success(`${type} deleted successfully`);
    queryClient.invalidateQueries({ queryKey: [`saved-${type}s`] });
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
                  <Checkbox checked={typeFilter === 'campaign'} onCheckedChange={() => setTypeFilter('campaign')} />
                  <label className="text-sm">Campaigns</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={typeFilter === 'ad_group'} onCheckedChange={() => setTypeFilter('ad_group')} />
                  <label className="text-sm">Ad Groups</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={typeFilter === 'ad'} onCheckedChange={() => setTypeFilter('ad')} />
                  <label className="text-sm">Ads</label>
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
                  {entities?.map(entity => (
                    <SelectItem key={entity.id} value={entity.name}>{entity.name}</SelectItem>
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

          {(typeFilter === 'all' || typeFilter === 'campaign') && filteredCampaigns.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Campaigns ({filteredCampaigns.length})</h3>
              <div className="grid grid-cols-2 gap-4">
                {filteredCampaigns.map(campaign => (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{campaign.name || campaign.template_name}</h4>
                          {campaign.entity && <p className="text-sm text-muted-foreground">Entity: {campaign.entity}</p>}
                        </div>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => navigate('/ads/search')}>
                          <Copy className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete('campaign', campaign.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(typeFilter === 'all' || typeFilter === 'ad_group') && filteredAdGroups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Ad Groups ({filteredAdGroups.length})</h3>
              <div className="grid grid-cols-2 gap-4">
                {filteredAdGroups.map(adGroup => (
                  <Card key={adGroup.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{adGroup.name || adGroup.template_name}</h4>
                          {adGroup.status && getApprovalBadge(adGroup.status)}
                        </div>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => navigate('/ads/search')}>
                          <Copy className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete('ad_group', adGroup.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(typeFilter === 'all' || typeFilter === 'ad') && filteredAds.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Ads ({filteredAds.length})</h3>
              <div className="grid grid-cols-2 gap-4">
                {filteredAds.map(ad => (
                  <Card key={ad.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{ad.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{ad.name}</p>
                          {ad.entity && <p className="text-xs text-muted-foreground mt-1">Entity: {ad.entity}</p>}
                        </div>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-2">
                          {ad.google_approval_status && getApprovalBadge(ad.google_approval_status)}
                          {ad.quality_score && (
                            <Badge variant="outline">Score: {ad.quality_score}/10</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => navigate('/ads/search')}>
                          <Copy className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete('ad', ad.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredCampaigns.length === 0 && filteredAdGroups.length === 0 && filteredAds.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No saved elements found. Start creating templates in the Search or Display planners!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
