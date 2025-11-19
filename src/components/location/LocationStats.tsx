import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp, Building2 } from "lucide-react";
import { MediaLocation } from "@/hooks/useMediaLocations";
import { Badge } from "@/components/ui/badge";

interface LocationStatsProps {
  locations: MediaLocation[];
}

export function LocationStats({ locations }: LocationStatsProps) {
  const totalLocations = locations.length;
  
  const cityCounts = locations.reduce((acc, loc) => {
    acc[loc.city] = (acc[loc.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const agencyCount = new Set(locations.filter(l => l.agency).map(l => l.agency)).size;

  return (
    <div className="grid gap-md md:grid-cols-3 mb-section">
      <Card className="hover-lift">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-heading-sm font-medium">Total Locations</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground transition-smooth group-hover:text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-page-title font-bold">{totalLocations}</div>
          <p className="text-metadata text-muted-foreground mt-xs">
            Across {Object.keys(cityCounts).length} cities
          </p>
        </CardContent>
      </Card>

      <Card className="hover-lift">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-heading-sm font-medium">City Distribution</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground transition-smooth group-hover:text-primary" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-xs">
            {Object.entries(cityCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([city, count]) => (
                <Badge key={city} variant="secondary" className="text-metadata">
                  {city}: {count}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-heading-sm font-medium">Agencies</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground transition-smooth group-hover:text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-page-title font-bold">{agencyCount}</div>
          <p className="text-metadata text-muted-foreground mt-xs">
            {agencyCount} different {agencyCount === 1 ? 'agency' : 'agencies'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
