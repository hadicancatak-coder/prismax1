import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { WebIntelSite, PastCampaign } from "@/hooks/useWebIntelSites";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WebIntelTableViewProps {
  sites: WebIntelSite[];
  allCampaigns: PastCampaign[];
  onView: (site: WebIntelSite) => void;
  onEdit: (site: WebIntelSite) => void;
  onDelete: (siteId: string) => void;
}

type SortField = 'name' | 'country' | 'type' | 'category' | 'traffic';
type SortDirection = 'asc' | 'desc';

export function WebIntelTableView({
  sites,
  allCampaigns,
  onView,
  onEdit,
  onDelete,
}: WebIntelTableViewProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSites = [...sites].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'country':
        comparison = a.country.localeCompare(b.country);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '');
        break;
      case 'traffic':
        comparison = (a.estimated_monthly_traffic || 0) - (b.estimated_monthly_traffic || 0);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const formatTraffic = (traffic?: number): string => {
    if (!traffic) return 'N/A';
    if (traffic >= 1000000000) return `${(traffic / 1000000000).toFixed(1)}B/mo`;
    if (traffic >= 1000000) return `${(traffic / 1000000).toFixed(1)}M/mo`;
    if (traffic >= 1000) return `${(traffic / 1000).toFixed(1)}K/mo`;
    return `${traffic}/mo`;
  };

  const getLastCampaign = (siteId: string) => {
    const campaigns = allCampaigns
      .filter(c => c.site_id === siteId)
      .sort((a, b) => new Date(b.campaign_date).getTime() - new Date(a.campaign_date).getTime());
    
    return campaigns[0];
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 px-2 lg:px-3"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  const typeColors: Record<string, string> = {
    'Website': 'status-info',
    'App': 'status-success',
    'Portal': 'status-purple',
    'Forum': 'status-orange',
  };

  const tagColors: Record<string, string> = {
    'GDN': 'status-info',
    'DV360': 'status-purple',
    'Direct': 'status-success',
    'Mobile-only': 'status-orange',
  };

  if (sites.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No sites found. Add your first site to get started.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="name">Name</SortButton>
            </TableHead>
            <TableHead>URL</TableHead>
            <TableHead>
              <SortButton field="country">Country</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="type">Type</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="category">Category</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="traffic">Traffic</SortButton>
            </TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Last Campaign</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSites.map((site) => {
            const lastCampaign = getLastCampaign(site.id);
            return (
              <TableRow key={site.id} className="hover:bg-muted/50 transition-smooth cursor-pointer">
                <TableCell className="font-medium">{site.name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  <a 
                    href={site.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {site.url}
                  </a>
                </TableCell>
                <TableCell>{site.country}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={typeColors[site.type]}>
                    {site.type}
                  </Badge>
                </TableCell>
                <TableCell>{site.category || 'N/A'}</TableCell>
                <TableCell>{formatTraffic(site.estimated_monthly_traffic)}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap max-w-[200px]">
                    {site.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="secondary"
                        className={tagColors[tag] || 'status-neutral'}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {lastCampaign ? (
                    <div className="text-sm">
                      <div className="font-medium">{lastCampaign.campaign_name}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(lastCampaign.campaign_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(site)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(site)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(site.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
