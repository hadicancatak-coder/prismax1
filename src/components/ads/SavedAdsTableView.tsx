import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Copy, Trash2 } from 'lucide-react';

interface SavedAd {
  id: string;
  name: string;
  entity: string;
  campaign: string | null;
  ad_group: string | null;
  ad_type: string;
  quality_score: number | null;
  use_count: number;
}

interface SavedAdsTableViewProps {
  ads: SavedAd[];
}

export function SavedAdsTableView({ ads }: SavedAdsTableViewProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'search': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'display': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad Name</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead>Ad Group</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quality</TableHead>
            <TableHead>Uses</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No saved ads found
              </TableCell>
            </TableRow>
          ) : (
            ads.map((ad) => (
              <TableRow key={ad.id} className="hover:bg-muted/50 transition-smooth cursor-pointer">
                <TableCell className="font-medium">{ad.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ad.entity}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {ad.campaign || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {ad.ad_group || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getTypeColor(ad.ad_type)}>
                    {ad.ad_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ad.quality_score ? (
                    <Badge variant={ad.quality_score >= 8 ? "default" : ad.quality_score >= 6 ? "secondary" : "destructive"}>
                      {ad.quality_score}/10
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{ad.use_count}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
