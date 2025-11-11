import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlannedCampaigns, PlannedCampaign, calculateDuration } from "@/hooks/usePlannedCampaigns";
import { useMediaLocations } from "@/hooks/useMediaLocations";
import { Download, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CampaignDetailDialogProps {
  campaign: PlannedCampaign | null;
  open: boolean;
  onClose: () => void;
}

export function CampaignDetailDialog({ campaign, open, onClose }: CampaignDetailDialogProps) {
  const { getPlacementsForCampaign, deleteCampaign } = usePlannedCampaigns();
  const { locations } = useMediaLocations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const totalCost = placementsData.reduce((sum, p) => sum + p.placement.allocated_budget, 0);

  const exportToCSV = () => {
    if (!campaign) return;

    const headers = [
      "Campaign Name",
      "Budget",
      "Start Date",
      "End Date",
      "Duration (months)",
      "Agency",
      "Location Name",
      "City",
      "Type",
      "Score",
      "Monthly Price",
      "Total Cost",
      "Notes"
    ];

    const rows = placementsData.map(({ placement, location, duration }) => [
      campaign.name,
      campaign.budget,
      campaign.start_date,
      campaign.end_date,
      duration,
      campaign.agency || '',
      location!.name,
      location!.city,
      location!.type,
      location!.manual_score || '',
      location!.price_per_month || '',
      placement.allocated_budget,
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
    await deleteCampaign.mutateAsync(campaign.id);
    setDeleteDialogOpen(false);
    onClose();
  };

  if (!campaign) return null;

  const duration = calculateDuration(campaign.start_date, campaign.end_date);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">{campaign.name}</DialogTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant={
                    campaign.status === 'active' ? 'default' : 
                    campaign.status === 'completed' ? 'secondary' : 
                    'outline'
                  }>
                    {campaign.status}
                  </Badge>
                  {campaign.cities.map(city => (
                    <Badge key={city} variant="outline">{city}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Campaign Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-accent/50">
              <div>
                <div className="text-sm text-muted-foreground">Budget</div>
                <div className="text-lg font-semibold">AED {campaign.budget.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Actual Cost</div>
                <div className="text-lg font-semibold">AED {totalCost.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="text-lg font-semibold">{duration} month{duration !== 1 ? 's' : ''}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Placements</div>
                <div className="text-lg font-semibold">{placementsData.length}</div>
              </div>
            </div>

            {campaign.agency && (
              <div className="text-sm">
                <span className="text-muted-foreground">Agency: </span>
                <span className="font-medium">{campaign.agency}</span>
              </div>
            )}

            {campaign.notes && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Notes</div>
                <div className="p-3 bg-accent rounded-lg text-sm">{campaign.notes}</div>
              </div>
            )}

            {/* Placements Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Campaign Placements</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Agency</TableHead>
                      <TableHead>Monthly Price</TableHead>
                      <TableHead>Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {placementsData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No placements found
                        </TableCell>
                      </TableRow>
                    ) : (
                      placementsData.map(({ placement, location }) => (
                        <TableRow key={placement.id}>
                          <TableCell className="font-medium">{location!.name}</TableCell>
                          <TableCell>{location!.city}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{location!.type}</Badge>
                          </TableCell>
                          <TableCell>
                            {location!.manual_score ? (
                              <Badge>{location!.manual_score}/10</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {location!.agency || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {location!.price_per_month ? (
                              `AED ${location!.price_per_month.toLocaleString()}`
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            AED {placement.allocated_budget.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Budget Summary */}
            <div className="flex justify-between items-center p-4 border rounded-lg bg-accent/50">
              <span className="font-semibold">Total Campaign Cost:</span>
              <span className="text-2xl font-bold">AED {totalCost.toLocaleString()}</span>
            </div>

            {totalCost !== campaign.budget && (
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {totalCost < campaign.budget ? 'Under Budget' : 'Over Budget'}:
                </span>
                <span className={`font-semibold ${totalCost < campaign.budget ? 'text-green-600' : 'text-destructive'}`}>
                  AED {Math.abs(campaign.budget - totalCost).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{campaign.name}"? This will also delete all associated placements. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
