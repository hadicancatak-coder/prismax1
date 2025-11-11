import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationWithDetails, getLocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface LocationDetailPopupProps {
  location: LocationWithDetails | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  isAdmin: boolean;
}

export function LocationDetailPopup({ location, open, onClose, onEdit, isAdmin }: LocationDetailPopupProps) {
  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
                    AED {location.price_per_month.toLocaleString()}/month
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
