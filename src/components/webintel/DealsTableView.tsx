import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, ExternalLink } from "lucide-react";
import { WebIntelDeal } from "@/hooks/useWebIntelDeals";

interface DealsTableViewProps {
  deals: WebIntelDeal[];
  onView: (deal: WebIntelDeal) => void;
  onEdit: (deal: WebIntelDeal) => void;
  onDelete: (dealId: string) => void;
  getCampaignCount: (dealId: string) => number;
  getUtmLinkCount: (dealId: string) => number;
  getWebsiteName: (websiteId: string | null) => string;
}

const statusColors = {
  Active: 'bg-green-500/10 text-green-500 border-green-500/20',
  Pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  Cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function DealsTableView({
  deals,
  onView,
  onEdit,
  onDelete,
  getCampaignCount,
  getUtmLinkCount,
  getWebsiteName,
}: DealsTableViewProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#1A1F2C]/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-gray-400">Status</TableHead>
            <TableHead className="text-gray-400">Name</TableHead>
            <TableHead className="text-gray-400">Website</TableHead>
            <TableHead className="text-gray-400">Contact</TableHead>
            <TableHead className="text-gray-400">Email</TableHead>
            <TableHead className="text-gray-400">Contract</TableHead>
            <TableHead className="text-gray-400 text-center">Campaigns</TableHead>
            <TableHead className="text-gray-400 text-center">UTMs</TableHead>
            <TableHead className="text-gray-400 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                No deals found
              </TableCell>
            </TableRow>
          ) : (
            deals.map((deal) => (
              <TableRow
                key={deal.id}
                className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => onView(deal)}
              >
                <TableCell>
                  <Badge className={statusColors[deal.status]}>
                    {deal.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-white">{deal.name}</TableCell>
                <TableCell className="text-gray-300">
                  {deal.website_id ? getWebsiteName(deal.website_id) : '-'}
                </TableCell>
                <TableCell className="text-gray-300">{deal.contact_name || '-'}</TableCell>
                <TableCell className="text-gray-300">
                  {deal.contact_email || '-'}
                </TableCell>
                <TableCell>
                  {deal.contract_link ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(deal.contract_link!, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{getCampaignCount(deal.id)}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{getUtmLinkCount(deal.id)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => onView(deal)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(deal)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(deal.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
