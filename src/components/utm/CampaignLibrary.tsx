import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUtmCampaigns } from '@/hooks/useUtmCampaigns';
import { EditCampaignDialog } from './EditCampaignDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteUtmCampaign } from '@/hooks/useUtmCampaigns';
import { Edit2, Trash2, ExternalLink, Search, SortAsc, SortDesc } from 'lucide-react';
import type { UtmCampaign } from '@/hooks/useUtmCampaigns';
import { formatDistanceToNow } from 'date-fns';

export function CampaignLibrary() {
  const { data: campaigns = [], isLoading } = useUtmCampaigns();
  const [editingCampaign, setEditingCampaign] = useState<UtmCampaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<UtmCampaign | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'lastUsed' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const deleteCampaign = useDeleteUtmCampaign();

  const handleDelete = () => {
    if (!deletingCampaign) return;
    deleteCampaign.mutate(deletingCampaign.id, {
      onSuccess: () => setDeletingCampaign(null)
    });
  };

  // Filter campaigns by search query
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.landing_page?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort campaigns
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'usage':
        comparison = (a.usage_count || 0) - (b.usage_count || 0);
        break;
      case 'lastUsed':
        const aTime = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
        const bTime = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
        comparison = aTime - bTime;
        break;
      case 'updated':
        const aUpdated = new Date(a.created_at).getTime();
        const bUpdated = new Date(b.created_at).getTime();
        comparison = aUpdated - bUpdated;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading campaigns...
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No campaigns yet. Add a campaign from the Builder tab.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search & Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns or landing pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Sort Options */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Last Edited</SelectItem>
                  <SelectItem value="lastUsed">Last Used</SelectItem>
                  <SelectItem value="usage">Usage Count</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {sortedCampaigns.length} of {campaigns.length} campaigns
          </div>
        </CardContent>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Landing Page</TableHead>
                <TableHead className="text-center">Usage</TableHead>
                <TableHead>Last Edited</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    {campaign.landing_page ? (
                      <a
                        href={campaign.landing_page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="max-w-xs truncate">{campaign.landing_page}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{campaign.usage_count || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {campaign.last_used_at
                      ? formatDistanceToNow(new Date(campaign.last_used_at), { addSuffix: true })
                      : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCampaign(campaign)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingCampaign(campaign)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingCampaign && (
        <EditCampaignDialog
          campaign={editingCampaign}
          open={!!editingCampaign}
          onOpenChange={(open) => !open && setEditingCampaign(null)}
        />
      )}

      <AlertDialog open={!!deletingCampaign} onOpenChange={(open) => !open && setDeletingCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCampaign?.name}"? This action cannot be undone.
              {deletingCampaign && deletingCampaign.usage_count > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This campaign has been used {deletingCampaign.usage_count} times.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
