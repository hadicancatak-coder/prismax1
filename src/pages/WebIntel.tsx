import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageContainer, PageHeader, DataCard, EmptyState } from "@/components/layout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useWebIntelDeals } from "@/hooks/useWebIntelDeals";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmLinks } from "@/hooks/useUtmLinks";
import { DealsTableView } from "@/components/webintel/DealsTableView";
import { DealFormDialog } from "@/components/webintel/DealFormDialog";
import { DealDetailDialog } from "@/components/webintel/DealDetailDialog";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Briefcase } from "lucide-react";

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

  const { data: campaigns = [] } = useUtmCampaigns();
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
    <PageContainer>
      <PageHeader
        icon={Briefcase}
        title="Deals Management"
        description="Track and manage partnership deals and campaigns"
        actions={
          <Button onClick={() => { setEditingDeal(null); setDealFormDialogOpen(true); }} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
        }
      />

      <DataCard noPadding>
        {isLoadingDeals ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : deals.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No deals yet"
            description="Create your first deal to start tracking partnerships"
            action={{
              label: "Add Deal",
              onClick: () => { setEditingDeal(null); setDealFormDialogOpen(true); }
            }}
          />
        ) : (
          <DealsTableView
            deals={deals}
            getCampaignCount={(dealId) => getCampaignsByDeal(dealId).length}
            getUtmLinkCount={(dealId) => getUtmLinksByDeal(dealId).length}
            getWebsiteName={() => 'N/A'}
            onView={handleViewDeal}
            onEdit={handleEditDeal}
            onDelete={handleDeleteDeal}
          />
        )}
      </DataCard>

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
        onDelete={() => { setDealDetailDialogOpen(false); handleDeleteDeal(viewingDeal?.id); }}
        campaigns={viewingDeal ? getCampaignsByDeal(viewingDeal.id).map(dc => {
          const campaign = campaigns.find(c => c.id === dc.campaign_id);
          return { id: dc.campaign_id, name: campaign?.name || 'Unknown Campaign' };
        }) : []}
        utmLinks={viewingDeal ? getUtmLinksByDeal(viewingDeal.id).map(du => {
          const link = utmLinks.find(l => l.id === du.utm_link_id);
          return { id: du.utm_link_id, utm_campaign: link?.campaign_name || '', final_url: link?.base_url || '' };
        }) : []}
        websiteName={'N/A'}
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
    </PageContainer>
  );
}
