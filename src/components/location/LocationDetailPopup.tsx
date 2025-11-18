import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationWithDetails, getLocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { useLocationCampaigns } from "@/hooks/useLocationCampaigns";
import { usePlannedCampaigns } from "@/hooks/usePlannedCampaigns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface LocationDetailPopupProps {
  location: LocationWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
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
              <DialogTitle className="text-2xl">{location.name}</DialogTitle>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="secondary">{location.city}</Badge>
                <Badge variant="outline">{location.type}</Badge>
                {location.manual_score && (
                  <Badge>Score: {location.manual_score}/10</Badge>
                )}
                {location.agency && (
                  <Badge variant="default">🏢 {location.agency}</Badge>
                )}
                {location.price_per_month && (
                  <Badge variant="secondary">
                    💰 AED {location.price_per_month.toLocaleString()}/mo
                  </Badge>
                )}
                {location.est_daily_traffic && (
                  <Badge variant="secondary">
                    👥 {location.est_daily_traffic.toLocaleString()} daily
                  </Badge>
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
            <h4 className="font-semibold mb-2">Location Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {location.agency && (
                <div>
                  <span className="text-muted-foreground">Agency:</span>{' '}
                  <span className="font-medium">{location.agency}</span>
                </div>
              )}
              {location.price_per_month && (
                <div>
                  <span className="text-muted-foreground">Price/Month:</span>{' '}
                  <span className="font-medium">AED {location.price_per_month.toLocaleString()}</span>
                </div>
              )}
              {location.est_daily_traffic && (
                <div>
                  <span className="text-muted-foreground">Daily Traffic:</span>{' '}
                  <span className="font-medium">{location.est_daily_traffic.toLocaleString()}</span>
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
              <div className="mt-2">
                <span className="text-muted-foreground text-sm">Notes:</span>
                <p className="text-sm mt-1">{location.notes}</p>
              </div>
            )}
          </div>

          {location.historic_prices.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Historic Prices</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {location.historic_prices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell>{price.year}</TableCell>
                      <TableCell>${price.price.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {campaignDetails.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Associated Campaigns ({campaignDetails.length})</h4>
              <div className="space-y-2">
                {campaignDetails.map((campaign) => campaign && (
                  <div
                    key={campaign.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{campaign.name}</p>
                      <p className="text-sm text-gray-400">
                        {format(new Date(campaign.start_date), "PP")} - {format(new Date(campaign.end_date), "PP")}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      Budget: AED {campaign.budget.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {location.past_campaigns.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Past Campaigns</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {location.past_campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                      <TableCell>${campaign.budget.toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(campaign.campaign_date), "PP")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
