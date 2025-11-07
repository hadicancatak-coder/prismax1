import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Pencil, Copy, Trash2, Download, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SavedAdsTableViewProps {
  ads: any[];
  onViewAd: (ad: any) => void;
  onEditAd: (ad: any) => void;
  onDeleteAd: (adId: string) => void;
  onRefresh: () => void;
}

export function SavedAdsTableView({ 
  ads, 
  onViewAd, 
  onEditAd, 
  onDeleteAd,
  onRefresh 
}: SavedAdsTableViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { copy } = useCopyToClipboard();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAds = [...ads].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    if (aVal < bVal) return -1 * direction;
    if (aVal > bVal) return 1 * direction;
    return 0;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === ads.length ? [] : ads.map(ad => ad.id));
  };

  const handleDuplicate = async (ad: any) => {
    try {
      const { error } = await supabase.from('ads').insert({
        ...ad,
        id: undefined,
        name: `${ad.name} (Copy)`,
        created_at: undefined,
        updated_at: undefined,
      });

      if (error) throw error;
      toast({ title: 'Success', description: 'Ad duplicated successfully' });
      onRefresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to duplicate ad', variant: 'destructive' });
    }
  };

  const handleBulkExport = () => {
    const selectedAds = ads.filter(ad => selectedIds.includes(ad.id));
    const csv = [
      ['Name', 'Entity', 'Campaign', 'Ad Group', 'Type', 'Status', 'Created'].join(','),
      ...selectedAds.map(ad => [
        ad.name,
        ad.entity,
        ad.campaign_name,
        ad.ad_group_name,
        ad.ad_type,
        ad.approval_status,
        format(new Date(ad.created_at), 'yyyy-MM-dd')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast({ title: 'Success', description: `Exported ${selectedIds.length} ads` });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="outline" onClick={handleBulkExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Selected
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              selectedIds.forEach(id => onDeleteAd(id));
              setSelectedIds([]);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedIds.length === ads.length && ads.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  Name <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('entity')} className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  Entity <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Ad Group</TableHead>
              <TableHead onClick={() => handleSort('ad_type')} className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  Type <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead onClick={() => handleSort('created_at')} className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  Created <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAds.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.includes(ad.id)}
                    onCheckedChange={() => toggleSelection(ad.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{ad.name}</TableCell>
                <TableCell>{ad.entity || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{ad.campaign_name || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{ad.ad_group_name || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {ad.ad_type || 'search'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(ad.approval_status)}>
                    {ad.approval_status || 'pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(ad.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onViewAd(ad)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onEditAd(ad)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(ad)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDeleteAd(ad.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedAds.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No ads found</p>
        </div>
      )}
    </div>
  );
}
