import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download } from "lucide-react";
import { useWebIntelSites } from "@/hooks/useWebIntelSites";
import { WebIntelStats } from "@/components/webintel/WebIntelStats";
import { WebIntelFilters, WebIntelFiltersState } from "@/components/webintel/WebIntelFilters";
import { WebIntelTableView } from "@/components/webintel/WebIntelTableView";
import { WebIntelFormDialog } from "@/components/webintel/WebIntelFormDialog";
import { WebIntelDetailDialog } from "@/components/webintel/WebIntelDetailDialog";
import { BulkSiteUploadDialog } from "@/components/webintel/BulkSiteUploadDialog";
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

  const [filters, setFilters] = useState<WebIntelFiltersState>({
    search: '',
    countries: [],
    types: [],
    categories: [],
    tags: [],
  });

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [viewingSite, setViewingSite] = useState<any>(null);

  // Get unique values for filters
  const availableCountries = Array.from(new Set(sites.map(s => s.country))).sort();
  const availableCategories = Array.from(new Set(sites.map(s => s.category).filter(Boolean) as string[])).sort();
  const availableTags = Array.from(new Set(sites.flatMap(s => s.tags))).sort();

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

    return matchesSearch && matchesCountry && matchesType && matchesCategory && matchesTags;
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

  const handleDelete = async (siteId: string) => {
    if (confirm("Are you sure you want to delete this site?")) {
      await deleteSite.mutateAsync(siteId);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
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
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <TableSkeleton rows={1} />
        </div>
      ) : (
        <WebIntelStats sites={sites} />
      )}

      {/* Filters */}
      <WebIntelFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableCountries={availableCountries}
        availableCategories={availableCategories}
        availableTags={availableTags}
      />

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <WebIntelTableView
          sites={filteredSites}
          allCampaigns={allCampaigns}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

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
    </div>
  );
}
