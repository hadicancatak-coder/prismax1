import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageContainer, PageHeader, DataCard, EmptyState } from "@/components/layout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useWebIntelDeals } from "@/hooks/useWebIntelDeals";
import { DealsTableView } from "@/components/webintel/DealsTableView";
import { DealFormDialog } from "@/components/webintel/DealFormDialog";
import { DealDetailDialog } from "@/components/webintel/DealDetailDialog";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Handshake } from "lucide-react";

export default function WebIntel() {
  const {
    deals,
    isLoading: isLoadingDeals,
    createDeal,
    updateDeal,
    deleteDeal,
  } = useWebIntelDeals();

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

  const handleSaveDeal = async (dealData: any) => {
    try {
      if (editingDeal) {
        await updateDeal.mutateAsync({ id: editingDeal.id, ...dealData });
        toast.success("Deal updated successfully");
      } else {
        await createDeal.mutateAsync(dealData);
        toast.success("Deal created successfully");
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
        icon={Handshake}
        title="Brand Deals"
        description="Track and manage potential brand collaborations and partnerships"
        actions={
          <Button onClick={() => { setEditingDeal(null); setDealFormDialogOpen(true); }} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
        }
      />

      <DataCard noPadding>
        {isLoadingDeals ? (
          <div className="p-md">
            <TableSkeleton />
          </div>
        ) : deals.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No brand deals yet"
            description="Add your first potential collaboration to start tracking partnerships"
            action={{
              label: "Add Deal",
              onClick: () => { setEditingDeal(null); setDealFormDialogOpen(true); }
            }}
          />
        ) : (
          <DealsTableView
            deals={deals}
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
        onSave={handleSaveDeal}
      />

      <DealDetailDialog
        open={dealDetailDialogOpen}
        onOpenChange={(open) => { setDealDetailDialogOpen(open); if (!open) setViewingDeal(null); }}
        deal={viewingDeal}
        onEdit={() => { setDealDetailDialogOpen(false); handleEditDeal(viewingDeal); }}
        onDelete={() => { setDealDetailDialogOpen(false); handleDeleteDeal(viewingDeal?.id); }}
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