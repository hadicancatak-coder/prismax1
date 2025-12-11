import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SiteWithDetails } from "@/hooks/useWebIntelSites";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface WebIntelDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: SiteWithDetails | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function WebIntelDetailDialog({
  open,
  onOpenChange,
  site,
  onEdit,
  onDelete,
}: WebIntelDetailDialogProps) {
  if (!site) return null;

  const formatTraffic = (traffic?: number): string => {
    if (!traffic) return 'N/A';
    if (traffic >= 1000000000) return `${(traffic / 1000000000).toFixed(1)}B/mo`;
    if (traffic >= 1000000) return `${(traffic / 1000000).toFixed(1)}M/mo`;
    if (traffic >= 1000) return `${(traffic / 1000).toFixed(1)}K/mo`;
    return `${traffic}/mo`;
  };

  const typeColors: Record<string, string> = {
    'Website': 'bg-info-soft text-info-text',
    'App': 'bg-success-soft text-success-text',
    'Portal': 'bg-purple-soft text-purple-text',
    'Forum': 'bg-orange-soft text-orange-text',
  };

  const tagColors: Record<string, string> = {
    'GDN': 'bg-info-soft text-info-text',
    'DV360': 'bg-purple-soft text-purple-text',
    'Direct': 'bg-success-soft text-success-text',
    'Mobile-only': 'bg-orange-soft text-orange-text',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-heading-lg">{site.name}</DialogTitle>
              <a 
                href={site.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-body-sm text-primary hover:underline flex items-center gap-xs mt-xs"
              >
                {site.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex gap-sm">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-xs" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-xs" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-lg">
          {/* Basic Details */}
          <div className="grid grid-cols-2 gap-md">
            <div>
              <p className="text-body-sm text-muted-foreground">Country</p>
              <p className="font-medium">{site.country}</p>
            </div>
            <div>
              <p className="text-body-sm text-muted-foreground">Type</p>
              <Badge variant="secondary" className={typeColors[site.type]}>
                {site.type}
              </Badge>
            </div>
            <div>
              <p className="text-body-sm text-muted-foreground">Category</p>
              <p className="font-medium">{site.category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-body-sm text-muted-foreground">Monthly Traffic</p>
              <p className="font-medium">{formatTraffic(site.estimated_monthly_traffic)}</p>
            </div>
            {site.entity && (
              <div className="col-span-2">
                <p className="text-body-sm text-muted-foreground">Publisher/Entity</p>
                <p className="font-medium">{site.entity}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {site.tags.length > 0 && (
            <div>
              <p className="text-body-sm text-muted-foreground mb-sm">Tags</p>
              <div className="flex gap-sm flex-wrap">
                {site.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className={tagColors[tag] || 'bg-muted text-muted-foreground'}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {site.notes && (
            <div>
              <p className="text-body-sm text-muted-foreground mb-sm">Notes</p>
              <p className="text-body-sm whitespace-pre-wrap">{site.notes}</p>
            </div>
          )}

          <Separator />

          {/* Historic Prices */}
          <div>
            <h3 className="font-semibold mb-sm">Historic Prices</h3>
            {site.historic_prices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {site.historic_prices.map(price => (
                    <TableRow key={price.id}>
                      <TableCell>{price.year}</TableCell>
                      <TableCell>${price.price.toLocaleString()}</TableCell>
                      <TableCell>{price.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-body-sm text-muted-foreground">No historic pricing data</p>
            )}
          </div>

          <Separator />

          {/* Past Campaigns */}
          <div>
            <h3 className="font-semibold mb-sm">Past Campaigns</h3>
            {site.past_campaigns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {site.past_campaigns.map(campaign => (
                    <TableRow key={campaign.id}>
                      <TableCell>{campaign.campaign_name}</TableCell>
                      <TableCell>{format(new Date(campaign.campaign_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>${campaign.budget.toLocaleString()}</TableCell>
                      <TableCell>{campaign.ctr ? `${campaign.ctr}%` : '-'}</TableCell>
                      <TableCell>{campaign.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-body-sm text-muted-foreground">No past campaigns</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
