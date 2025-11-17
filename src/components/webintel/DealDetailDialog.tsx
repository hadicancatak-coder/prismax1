import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { WebIntelDeal } from "@/hooks/useWebIntelDeals";
import { format } from "date-fns";

interface DealDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: WebIntelDeal | null;
  onEdit: () => void;
  onDelete: () => void;
  campaigns: Array<{ id: string; name: string }>;
  utmLinks: Array<{ id: string; utm_campaign: string; final_url: string }>;
  websiteName: string;
}

const statusColors = {
  Active: 'bg-green-500/10 text-green-500 border-green-500/20',
  Pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  Cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function DealDetailDialog({
  open,
  onOpenChange,
  deal,
  onEdit,
  onDelete,
  campaigns,
  utmLinks,
  websiteName,
}: DealDetailDialogProps) {
  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{deal.name}</DialogTitle>
              <Badge className={`mt-2 ${statusColors[deal.status]}`}>
                {deal.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Website</h3>
              <p className="text-white">{websiteName || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Deal Value</h3>
              <p className="text-white">
                {deal.deal_value ? `$${deal.deal_value.toLocaleString()}` : '-'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Start Date</h3>
              <p className="text-white">
                {deal.start_date ? format(new Date(deal.start_date), 'MMM dd, yyyy') : '-'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">End Date</h3>
              <p className="text-white">
                {deal.end_date ? format(new Date(deal.end_date), 'MMM dd, yyyy') : '-'}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-lg font-medium text-white mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Contact Name</h4>
                <p className="text-white">{deal.contact_name || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Contact Email</h4>
                <p className="text-white">{deal.contact_email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Contract Link */}
          {deal.contract_link && (
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-lg font-medium text-white mb-3">Contract</h3>
              <Button
                variant="outline"
                onClick={() => window.open(deal.contract_link!, '_blank')}
                className="w-full justify-start"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Contract Document
              </Button>
            </div>
          )}

          {/* Associated Campaigns */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-lg font-medium text-white mb-3">
              Associated Campaigns ({campaigns.length})
            </h3>
            {campaigns.length > 0 ? (
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <p className="text-white">{campaign.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No campaigns associated</p>
            )}
          </div>

          {/* Associated UTM Links */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-lg font-medium text-white mb-3">
              Associated UTM Links ({utmLinks.length})
            </h3>
            {utmLinks.length > 0 ? (
              <div className="space-y-2">
                {utmLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{link.utm_campaign}</p>
                      <p className="text-sm text-gray-400 truncate">{link.final_url}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(link.final_url)}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No UTM links associated</p>
            )}
          </div>

          {/* Notes */}
          {deal.notes && (
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-lg font-medium text-white mb-3">Notes</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
