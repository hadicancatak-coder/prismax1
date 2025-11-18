import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useWebIntelSites } from "@/hooks/useWebIntelSites";
import { useWebIntelDeals } from "@/hooks/useWebIntelDeals";
import { usePlannedCampaigns } from "@/hooks/usePlannedCampaigns";
import { useUtmLinks } from "@/hooks/useUtmLinks";
import { WebIntelStats } from "@/components/webintel/WebIntelStats";
import { WebIntelFilters, WebIntelFiltersState } from "@/components/webintel/WebIntelFilters";
import { WebIntelTableView } from "@/components/webintel/WebIntelTableView";
import { WebIntelFormDialog } from "@/components/webintel/WebIntelFormDialog";
import { WebIntelDetailDialog } from "@/components/webintel/WebIntelDetailDialog";
import { BulkSiteUploadDialog } from "@/components/webintel/BulkSiteUploadDialog";
import { DealsTableView } from "@/components/webintel/DealsTableView";
import { DealFormDialog } from "@/components/webintel/DealFormDialog";
import { DealDetailDialog } from "@/components/webintel/DealDetailDialog";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function WebIntel() {
  const {
    sites,
    isLoading,
    allPrices,
    allCampaigns,
    createSite,
    updateSite,
    deleteSite,
    upsertPrices,
    upsertCampaigns,
    getSiteWithDetails,
  } = useWebIntelSites();

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

  const [activeTab, setActiveTab] = useState("websites");

  const [filters, setFilters] = useState<WebIntelFiltersState>({
    search: '',
    countries: [],
    types: [],
    categories: [],
    tags: [],
    entities: [],
  });

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [dealFormDialogOpen, setDealFormDialogOpen] = useState(false);
  const [dealDetailDialogOpen, setDealDetailDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [viewingSite, setViewingSite] = useState<any>(null);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [viewingDeal, setViewingDeal] = useState<any>(null);

  // Get unique values for filters
  const availableCountries = Array.from(new Set(sites.map(s => s.country))).sort();
  const availableCategories = ['Trading', 'Generic', 'Business', 'App'];
  const availableTags = Array.from(new Set(sites.flatMap(s => s.tags))).sort();
  const availableEntities = Array.from(new Set(sites.map(s => s.entity).filter(Boolean) as string[])).sort();

  // Apply filters
  const filteredSites = sites.filter(site => {
    const matchesSearch = !filters.search || 
      site.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      site.url.toLowerCase().includes(filters.search.toLowerCase()) ||
      (site.entity && site.entity.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesCountry = filters.countries.length === 0 || filters.countries.includes(site.country);
    const matchesType = filters.types.length === 0 || filters.types.includes(site.type);
    const matchesCategory = filters.categories.length === 0 || (site.category && filters.categories.includes(site.category));
    const matchesTags = filters.tags.length === 0 || filters.tags.some(tag => site.tags.includes(tag));
    const matchesEntity = filters.entities.length === 0 || (site.entity && filters.entities.includes(site.entity));

    return matchesSearch && matchesCountry && matchesType && matchesCategory && matchesTags && matchesEntity;
  });

  const handleAdd = () => {
    setEditingSite(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (site: any) => {
    const siteWithDetails = getSiteWithDetails(site.id);
    setEditingSite(siteWithDetails);
    setFormDialogOpen(true);
  };

  const handleView = (site: any) => {
    const siteWithDetails = getSiteWithDetails(site.id);
    setViewingSite(siteWithDetails);
    setDetailDialogOpen(true);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (siteId: string) => {
    setDeleteConfirmId(siteId);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteSite.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleSave = async (siteData: any, prices: any[], campaigns: any[]) => {
    try {
      if (editingSite) {
        await updateSite.mutateAsync({ id: editingSite.id, ...siteData });
        await upsertPrices.mutateAsync({ siteId: editingSite.id, prices });
        await upsertCampaigns.mutateAsync({ siteId: editingSite.id, campaigns });
      } else {
        const newSite = await createSite.mutateAsync(siteData);
        if (prices.length > 0) {
          await upsertPrices.mutateAsync({ siteId: newSite.id, prices });
        }
        if (campaigns.length > 0) {
          await upsertCampaigns.mutateAsync({ siteId: newSite.id, campaigns });
        }
      }
      setFormDialogOpen(false);
      setEditingSite(null);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleBulkImport = async (sitesData: any[]) => {
    try {
      for (const siteData of sitesData) {
        await createSite.mutateAsync(siteData);
      }
      toast.success(`Imported ${sitesData.length} sites successfully`);
    } catch (error) {
      toast.error("Failed to import some sites");
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'URL', 'Country', 'Type', 'Category', 'Monthly Traffic', 'Entity', 'Tags', 'Notes'];
    const rows = filteredSites.map(site => [
      site.name,
      site.url,
      site.country,
      site.type,
      site.category || '',
      site.estimated_monthly_traffic || '',
      site.entity || '',
      site.tags.join(','),
      site.notes || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-intel-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const handleAddDeal = () => {
    setEditingDeal(null);
    setDealFormDialogOpen(true);
  };

  const handleEditDeal = (deal: any) => {
    setEditingDeal(deal);
    setDealFormDialogOpen(true);
  };

  const handleViewDeal = (deal: any) => {
    setViewingDeal(deal);
    setDealDetailDialogOpen(true);
  };

  const [deleteDealConfirmId, setDeleteDealConfirmId] = useState<string | null>(null);

  const handleDeleteDeal = (dealId: string) => {
    setDeleteDealConfirmId(dealId);
  };

  const confirmDeleteDeal = async () => {
    if (deleteDealConfirmId) {
      await deleteDeal.mutateAsync(deleteDealConfirmId);
      setDeleteDealConfirmId(null);
    }
  };

  const handleSaveDeal = async (dealData: any, campaignIds: string[], utmLinkIds: string[]) => {
    try {
      let dealId: string;
      if (editingDeal) {
        const result = await updateDeal.mutateAsync({ id: editingDeal.id, ...dealData });
        dealId = result.id;
      } else {
        const result = await createDeal.mutateAsync(dealData);
        dealId = result.id;
      }
      
      // Add campaigns and UTM links
      if (campaignIds.length > 0) {
        await Promise.all(campaignIds.map(campaignId => addCampaignToDeal.mutateAsync({ dealId, campaignId })));
      }
      if (utmLinkIds.length > 0) {
        await Promise.all(utmLinkIds.map(utmLinkId => addUtmLinkToDeal.mutateAsync({ dealId, utmLinkId })));
      }
      
      toast.success(editingDeal ? "Deal updated successfully" : "Deal created successfully");
      setDealFormDialogOpen(false);
      setEditingDeal(null);
    } catch (error: any) {
      console.error('Save deal error:', error);
      toast.error(error.message || "Failed to save deal");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Web Intel</h1>
          <p className="text-muted-foreground mt-1">
            Manage direct media deals and programmatic website targeting lists
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={filteredSites.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={activeTab === 'websites' ? handleAdd : handleAddDeal}>
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === 'websites' ? 'Add Site' : 'Add Deal'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="websites">Websites</TabsTrigger>
          <TabsTrigger value="deals">
            <FileText className="h-4 w-4 mr-2" />
            Deals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="websites" className="space-y-6">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <WebIntelStats sites={sites} />
              <WebIntelFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableCountries={availableCountries}
                availableCategories={availableCategories}
                availableTags={availableTags}
                availableEntities={availableEntities}
              />
              <WebIntelTableView
                sites={filteredSites}
                allCampaigns={allCampaigns}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="deals" className="space-y-6">
          {isLoadingDeals ? (
            <TableSkeleton />
          ) : (
            <DealsTableView
              deals={deals}
              onView={handleViewDeal}
              onEdit={handleEditDeal}
              onDelete={handleDeleteDeal}
              getCampaignCount={(dealId) => getCampaignsByDeal(dealId).length}
              getUtmLinkCount={(dealId) => getUtmLinksByDeal(dealId).length}
              getWebsiteName={(websiteId) => sites.find(s => s.id === websiteId)?.name || 'N/A'}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <WebIntelFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        site={editingSite}
        historicPrices={editingSite?.historic_prices}
        pastCampaigns={editingSite?.past_campaigns}
        onSave={handleSave}
      />

      <WebIntelDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        site={viewingSite}
        onEdit={() => {
          setDetailDialogOpen(false);
          handleEdit(viewingSite);
        }}
        onDelete={() => {
          setDetailDialogOpen(false);
          handleDelete(viewingSite.id);
        }}
      />

      <BulkSiteUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onImport={handleBulkImport}
      />

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this site? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
