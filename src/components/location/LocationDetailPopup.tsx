import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationWithDetails, getLocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { useLocationCampaigns } from "@/hooks/useLocationCampaigns";
import { usePlannedCampaigns } from "@/hooks/usePlannedCampaigns";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface LocationDetailPopupProps {
  location: LocationWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function LocationDetailPopup({ location, open, onOpenChange, onEdit, onDelete }: LocationDetailPopupProps) {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const { getCampaignsByLocation } = useLocationCampaigns();
  const { campaigns: allCampaigns } = usePlannedCampaigns();
  
  if (!location) return null;

  const locationCampaigns = getCampaignsByLocation(location.id);
  const campaignDetails = locationCampaigns.map(cl => 
    allCampaigns.find(c => c.id === cl.campaign_id)
  ).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
            <DialogTitle className="text-heading-lg">{location.name}</DialogTitle>
            <div className="flex gap-sm mt-sm flex-wrap">
              <Badge variant="secondary">{location.city}</Badge>
              <Badge variant="outline">{location.type}</Badge>
              {location.agency && (
                <Badge variant="default">🏢 {location.agency}</Badge>
              )}
              {getLocationCategory(location.type) && (
                <Badge variant="outline">
                  {LOCATION_CATEGORIES[getLocationCategory(location.type)!].emoji}{" "}
                  {getLocationCategory(location.type)}
                </Badge>
              )}
            </div>
            </div>
            {isAdmin && (
              <Button size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {location.image_url && (
            <div>
              <img
                src={location.image_url}
                alt={location.name}
                className="w-full h-64 object-cover rounded-lg border"
              />
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-sm">Location Details</h4>
            <div className="grid grid-cols-2 gap-sm text-body-sm">
              {location.agency && (
                <div>
                  <span className="text-muted-foreground">Agency:</span>{' '}
                  <span className="font-medium">{location.agency}</span>
                </div>
              )}
              {getLocationCategory(location.type) && (
                <div>
                  <span className="text-muted-foreground">Category:</span>{' '}
                  <span className="font-medium">{LOCATION_CATEGORIES[getLocationCategory(location.type)!].emoji} {getLocationCategory(location.type)}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Latitude:</span> {location.latitude}
              </div>
              <div>
                <span className="text-muted-foreground">Longitude:</span> {location.longitude}
              </div>
            </div>
            {location.notes && (
              <div className="mt-sm">
                <span className="text-muted-foreground text-body-sm">Notes:</span>
                <p className="text-body-sm mt-xs">{location.notes}</p>
              </div>
            )}
          </div>

          {campaignDetails.length > 0 && (
            <div>
              <h4 className="font-semibold mb-sm">Associated Campaigns ({campaignDetails.length})</h4>
              <div className="space-y-sm">
                {campaignDetails.map((campaign) => campaign && (
                  <div
                    key={campaign.id}
                    className="p-3 rounded-lg bg-muted border border-border flex items-center justify-between transition-smooth hover:bg-muted-hover hover:shadow-md"
                  >
                    <div>
                      <p className="font-medium text-foreground">{campaign.name}</p>
                      <p className="text-body-sm text-muted-foreground">
                        {format(new Date(campaign.start_date), "PP")} - {format(new Date(campaign.end_date), "PP")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="transition-smooth">
                      {format(new Date(campaign.start_date), "MMM")} - {format(new Date(campaign.end_date), "MMM yyyy")}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
