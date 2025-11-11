import { Card, CardContent } from "@/components/ui/card";
import { Globe, TrendingUp, Handshake, Target, BarChart } from "lucide-react";
import { WebIntelSite } from "@/hooks/useWebIntelSites";

interface WebIntelStatsProps {
  sites: WebIntelSite[];
}

export function WebIntelStats({ sites }: WebIntelStatsProps) {
  const totalSites = sites.length;
  
  const combinedTraffic = sites.reduce((sum, site) => 
    sum + (site.estimated_monthly_traffic || 0), 0
  );
  
  const directDeals = sites.filter(site => 
    site.tags.includes('Direct')
  ).length;
  
  const gdnTargeted = sites.filter(site => 
    site.tags.includes('GDN')
  ).length;
  
  const categoryCount: Record<string, number> = {};
  sites.forEach(site => {
    if (site.category) {
      categoryCount[site.category] = (categoryCount[site.category] || 0) + 1;
    }
  });
  
  const topCategory = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])[0];
  
  const topCategoryText = topCategory 
    ? `${topCategory[0]} (${Math.round((topCategory[1] / totalSites) * 100)}%)`
    : 'N/A';
  
  const formatTraffic = (traffic: number): string => {
    if (traffic >= 1000000000) return `${(traffic / 1000000000).toFixed(1)}B/mo`;
    if (traffic >= 1000000) return `${(traffic / 1000000).toFixed(1)}M/mo`;
    if (traffic >= 1000) return `${(traffic / 1000).toFixed(1)}K/mo`;
    return `${traffic}/mo`;
  };

  const stats = [
    {
      title: "Total Sites",
      value: totalSites.toString(),
      icon: Globe,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Combined Monthly Traffic",
      value: combinedTraffic > 0 ? formatTraffic(combinedTraffic) : 'N/A',
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Direct Deals",
      value: directDeals.toString(),
      icon: Handshake,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "GDN-Targeted",
      value: gdnTargeted.toString(),
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Top Category",
      value: topCategoryText,
      icon: BarChart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
