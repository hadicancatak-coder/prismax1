import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp, Star } from "lucide-react";
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

  const avgScore = locations.length > 0
    ? (locations.reduce((sum, loc) => sum + (loc.manual_score || 0), 0) / locations.length).toFixed(1)
    : "0.0";

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLocations}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {Object.keys(cityCounts).length} cities
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">City Distribution</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {Object.entries(cityCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([city, count]) => (
                <Badge key={city} variant="secondary" className="text-xs">
                  {city}: {count}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgScore}/10</div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {locations.filter(l => l.manual_score).length} rated locations
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
