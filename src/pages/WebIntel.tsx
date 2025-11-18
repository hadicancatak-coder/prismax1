import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useWebIntelDeals } from "@/hooks/useWebIntelDeals";
import { usePlannedCampaigns } from "@/hooks/usePlannedCampaigns";
import { useUtmLinks } from "@/hooks/useUtmLinks";
import { DealsTableView } from "@/components/webintel/DealsTableView";
import { DealFormDialog } from "@/components/webintel/DealFormDialog";
import { DealDetailDialog } from "@/components/webintel/DealDetailDialog";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function WebIntel() {
  const {
    deals,
    isLoading: isLoadingDeals,
    dealCampaigns,
    dealUtmLinks,
    createDeal,
    updateDeal,
    deleteDeal,
    addCampaignToDeal,
    addUtmLinkToDeal,
    getCampaignsByDeal,
    getUtmLinksByDeal,
  } = useWebIntelDeals();

  const { campaigns } = usePlannedCampaigns();
  const { data: utmLinks = [] } = useUtmLinks();

  const [dealFormDialogOpen, setDealFormDialogOpen] = useState(false);
  const [dealDetailDialogOpen, setDealDetailDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [viewingDeal, setViewingDeal] = useState<any>(null);
  const [deleteDealConfirmId, setDeleteDealConfirmId] = useState<string | null>(null);

  const handleEditDeal = (deal: any) => {
    setEditingDeal(deal);
    setDealFormDialogOpen(true);
  };

  const handleViewDeal = (deal: any) => {
    setViewingDeal(deal);
    setDealDetailDialogOpen(true);
  };

  const handleSaveDeal = async (dealData: any, campaignIds: string[], utmLinkIds: string[]) => {
    try {
      let dealId: string;
      if (editingDeal) {
        await updateDeal.mutateAsync({ id: editingDeal.id, ...dealData });
        dealId = editingDeal.id;
        toast.success("Deal updated successfully");
      } else {
        const newDeal = await createDeal.mutateAsync(dealData);
        dealId = newDeal.id;
        toast.success("Deal created successfully");
      }

      const existingCampaignIds = getCampaignsByDeal(dealId).map(dc => dc.campaign_id);
      const campaignsToAdd = campaignIds.filter(id => !existingCampaignIds.includes(id));
      for (const campaignId of campaignsToAdd) {
        await addCampaignToDeal.mutateAsync({ dealId, campaignId });
      }

      const existingUtmLinkIds = getUtmLinksByDeal(dealId).map(du => du.utm_link_id);
      const utmLinksToAdd = utmLinkIds.filter(id => !existingUtmLinkIds.includes(id));
      for (const utmLinkId of utmLinksToAdd) {
        await addUtmLinkToDeal.mutateAsync({ dealId, utmLinkId });
      }

      setEditingDeal(null);
    } catch (error) {
      console.error("Error saving deal:", error);
      toast.error("Failed to save deal");
    }
  };

  const handleDeleteDeal = (dealId: string) => {
    setDeleteDealConfirmId(dealId);
  };

  const confirmDeleteDeal = async () => {
    if (!deleteDealConfirmId) return;
    try {
      await deleteDeal.mutateAsync(deleteDealConfirmId);
      toast.success("Deal deleted successfully");
      setDeleteDealConfirmId(null);
    } catch (error) {
      console.error("Error deleting deal:", error);
      toast.error("Failed to delete deal");
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deals Management</h1>
          <p className="text-muted-foreground">Track and manage partnership deals and campaigns</p>
        </div>
        <Button onClick={() => { setEditingDeal(null); setDealFormDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </div>

      {isLoadingDeals ? <TableSkeleton /> : (
        <DealsTableView
          deals={deals}
          dealCampaigns={dealCampaigns}
          getCampaignsByDeal={getCampaignsByDeal}
          getUtmLinksByDeal={getUtmLinksByDeal}
          getWebsiteName={() => 'N/A'}
          onView={handleViewDeal}
          onEdit={handleEditDeal}
          onDelete={handleDeleteDeal}
        />
      )}

      <DealFormDialog
        open={dealFormDialogOpen}
        onOpenChange={(open) => { setDealFormDialogOpen(open); if (!open) setEditingDeal(null); }}
        deal={editingDeal}
        initialCampaignIds={editingDeal ? getCampaignsByDeal(editingDeal.id).map(dc => dc.campaign_id) : []}
        initialUtmLinkIds={editingDeal ? getUtmLinksByDeal(editingDeal.id).map(du => du.utm_link_id) : []}
        onSave={handleSaveDeal}
      />

      <DealDetailDialog
        open={dealDetailDialogOpen}
        onOpenChange={(open) => { setDealDetailDialogOpen(open); if (!open) setViewingDeal(null); }}
        deal={viewingDeal}
        onEdit={() => { setDealDetailDialogOpen(false); handleEditDeal(viewingDeal); }}
        onDelete={() => { setDealDetailDialogOpen(false); handleDeleteDeal(viewingDeal.id); }}
      />

      <AlertDialog open={deleteDealConfirmId !== null} onOpenChange={(open) => !open && setDeleteDealConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this deal? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDeal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
