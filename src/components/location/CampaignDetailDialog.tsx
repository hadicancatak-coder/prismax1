import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlannedCampaigns, PlannedCampaign, calculateDuration, getSeasonIndicator } from "@/hooks/usePlannedCampaigns";
import { useMediaLocations } from "@/hooks/useMediaLocations";
import { Download, Trash2, Pencil, Calendar, MapPin } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CampaignPlannerDialog } from "./CampaignPlannerDialog";
import { format } from "date-fns";

interface CampaignDetailDialogProps {
  campaign: PlannedCampaign | null;
  open: boolean;
  onClose: () => void;
}

export function CampaignDetailDialog({ campaign, open, onClose }: CampaignDetailDialogProps) {
  const { getPlacementsForCampaign, deleteCampaign } = usePlannedCampaigns();
  const { locations } = useMediaLocations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const placementsData = useMemo(() => {
    if (!campaign) return [];
    
    const placements = getPlacementsForCampaign(campaign.id);
    const duration = calculateDuration(campaign.start_date, campaign.end_date);
    
    return placements.map(p => {
      const location = locations.find(l => l.id === p.location_id);
      return {
        placement: p,
        location,
        duration,
      };
    }).filter(p => p.location);
  }, [campaign, locations, getPlacementsForCampaign]);

  const exportToCSV = () => {
    if (!campaign) return;

    const headers = [
      "Campaign Name",
      "Start Date",
      "End Date",
      "Duration (months)",
      "Agency",
      "Location Name",
      "City",
      "Type",
      "Notes"
    ];

    const duration = calculateDuration(campaign.start_date, campaign.end_date);
    
    const rows = placementsData.map(({ placement, location }) => [
      campaign.name,
      campaign.start_date,
      campaign.end_date,
      duration,
      campaign.agency || '',
      location!.name,
      location!.city,
      location!.type,
      placement.notes || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-${campaign.name.replace(/\s+/g, '-')}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleDelete = async () => {
    if (!campaign) return;
    
    try {
      await deleteCampaign.mutateAsync(campaign.id);
      setDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      console.error("Failed to delete campaign:", error);
    }
  };

  if (!campaign) return null;

  const duration = calculateDuration(campaign.start_date, campaign.end_date);
  const season = getSeasonIndicator(campaign.start_date, campaign.end_date);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-page-title">{campaign.name}</DialogTitle>
                <div className="flex gap-sm mt-sm flex-wrap">
                  <Badge variant={
                    campaign.status === 'active' ? 'default' : 
                    campaign.status === 'completed' ? 'secondary' : 
                    'outline'
                  }>
                    {campaign.status}
                  </Badge>
                  <Badge variant="outline">{duration} month{duration !== 1 ? 's' : ''}</Badge>
                  {season !== 'Regular Season' && (
                    <Badge variant="secondary">{season}</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-sm">
                <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-section p-card">
            {/* Campaign Overview */}
            <div className="grid gap-md grid-cols-2">
              <div>
                <div className="flex items-center gap-sm text-body-sm text-muted-foreground mb-xs">
                  <Calendar className="h-4 w-4" />
                  <span>Campaign Period</span>
                </div>
                <p className="text-body-sm font-medium">
                  {format(new Date(campaign.start_date), "MMM d, yyyy")} → {format(new Date(campaign.end_date), "MMM d, yyyy")}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-sm text-body-sm text-muted-foreground mb-xs">
                  <MapPin className="h-4 w-4" />
                  <span>Target Cities</span>
                </div>
                <p className="text-body-sm font-medium">{campaign.cities.join(', ')}</p>
              </div>
            </div>

            {/* Agency & Notes */}
            {(campaign.agency || campaign.notes) && (
              <div className="space-y-md">
                {campaign.agency && (
                  <div>
                    <span className="text-body-sm text-muted-foreground">Agency:</span>
                    <p className="text-body-sm font-medium mt-xs">{campaign.agency}</p>
                  </div>
                )}
                {campaign.notes && (
                  <div>
                    <span className="text-body-sm text-muted-foreground">Notes:</span>
                    <p className="text-body-sm mt-xs">{campaign.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Placements */}
            {placementsData.length > 0 && (
              <div>
                <h3 className="text-heading-md font-semibold mb-md">
                  Media Placements ({placementsData.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Agency</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {placementsData.map(({ placement, location }) => (
                        <TableRow key={placement.id}>
                          <TableCell className="font-medium">{location!.name}</TableCell>
                          <TableCell>{location!.city}</TableCell>
                          <TableCell>{location!.type}</TableCell>
                          <TableCell>{location!.agency || '—'}</TableCell>
                          <TableCell className="text-muted-foreground text-body-sm">
                            {placement.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CampaignPlannerDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        locations={[]}
        campaign={campaign}
        mode="edit"
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{campaign.name}" and all its placements. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
