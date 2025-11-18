import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaLocation } from "@/hooks/useMediaLocations";
import { Building2, MapPin } from "lucide-react";

interface VendorsDialogProps {
  open: boolean;
  onClose: () => void;
  locations: MediaLocation[];
  onFilterByAgency: (agency: string) => void;
}

interface VendorStats {
  name: string;
  count: number;
  cities: string[];
  types: string[];
  avgPrice: number;
  totalPrice: number;
}

export function VendorsDialog({ 
  open, 
  onClose, 
  locations,
  onFilterByAgency 
}: VendorsDialogProps) {
  const vendorStats = useMemo<VendorStats[]>(() => {
    const stats = new Map<string, VendorStats>();
    
    locations.forEach(loc => {
      if (!loc.agency) return;
      
      if (!stats.has(loc.agency)) {
        stats.set(loc.agency, {
          name: loc.agency,
          count: 0,
          cities: [],
          types: [],
          avgPrice: 0,
          totalPrice: 0
        });
      }
      
      const vendor = stats.get(loc.agency)!;
      vendor.count++;
      
      if (!vendor.cities.includes(loc.city)) {
        vendor.cities.push(loc.city);
      }
      
      if (!vendor.types.includes(loc.type)) {
        vendor.types.push(loc.type);
      }
      
      if (loc.price_per_month) {
        vendor.totalPrice += loc.price_per_month;
      }
    });
    
    return Array.from(stats.values())
      .map(v => ({
        ...v,
        avgPrice: v.totalPrice / v.count,
        cities: v.cities.sort(),
        types: v.types.sort()
      }))
      .sort((a, b) => b.count - a.count);
  }, [locations]);

  const handleViewLocations = (agency: string) => {
    onFilterByAgency(agency);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Vendors & Agencies</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {vendorStats.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No vendor information available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendorStats.map((vendor) => (
                <Card key={vendor.name} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{vendor.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {vendor.count} location{vendor.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground line-clamp-2">
                        {vendor.cities.join(", ")}
                      </span>
                    </div>
                    
                    {vendor.avgPrice > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Avg: <span className="font-medium text-foreground">
                          AED {Math.round(vendor.avgPrice).toLocaleString()}/mo
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {vendor.types.map(type => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleViewLocations(vendor.name)}
                  >
                    View Locations
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
