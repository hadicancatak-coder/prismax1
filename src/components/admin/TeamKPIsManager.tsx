import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Target, Edit, Search, TrendingUp } from "lucide-react";
import { KPIManager } from "@/components/KPIManager";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileWithKPIs {
  user_id: string;
  name: string;
  avatar_url: string;
  email: string;
  kpis: any;
  quarterly_kpis: any;
}

export function TeamKPIsManager() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileWithKPIs[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithKPIs | null>(null);
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [kpiType, setKpiType] = useState<'annual' | 'quarterly'>('annual');

  useEffect(() => {
    fetchTeamKPIs();
  }, []);

  const fetchTeamKPIs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, email, kpis, quarterly_kpis")
        .order("name");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditKPIs = (profile: ProfileWithKPIs, type: 'annual' | 'quarterly') => {
    setSelectedProfile(profile);
    setKpiType(type);
    setKpiDialogOpen(true);
  };

  const handleSaveKPIs = async (kpis: any[]) => {
    if (!selectedProfile) return;

    const field = kpiType === 'annual' ? 'kpis' : 'quarterly_kpis';
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: kpis })
        .eq("user_id", selectedProfile.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${kpiType === 'annual' ? 'Annual' : 'Quarterly'} KPIs updated successfully`,
      });

      setKpiDialogOpen(false);
      fetchTeamKPIs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getKPIStats = () => {
    const totalMembers = profiles.length;
    const membersWithAnnualKPIs = profiles.filter(p => Array.isArray(p.kpis) && p.kpis.length > 0).length;
    const membersWithQuarterlyKPIs = profiles.filter(p => Array.isArray(p.quarterly_kpis) && p.quarterly_kpis.length > 0).length;
    const avgKPIsPerPerson = profiles.reduce((acc, p) => {
      const kpiCount = (Array.isArray(p.kpis) ? p.kpis.length : 0) + (Array.isArray(p.quarterly_kpis) ? p.quarterly_kpis.length : 0);
      return acc + kpiCount;
    }, 0) / (totalMembers || 1);

    return { totalMembers, membersWithAnnualKPIs, membersWithQuarterlyKPIs, avgKPIsPerPerson };
  };

  const stats = getKPIStats();

  const filteredProfiles = search
    ? profiles.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()))
    : profiles;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Team KPIs Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Team KPIs Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">With Annual KPIs</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.membersWithAnnualKPIs}</p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">With Quarterly KPIs</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.membersWithQuarterlyKPIs}</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Avg KPIs/Person</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.avgKPIsPerPerson.toFixed(1)}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Team Members List */}
          <div className="space-y-3">
            {filteredProfiles.map(profile => {
              const annualKPIs = Array.isArray(profile.kpis) ? profile.kpis : [];
              const quarterlyKPIs = Array.isArray(profile.quarterly_kpis) ? profile.quarterly_kpis : [];
              const annualWeight = annualKPIs.reduce((sum: number, kpi: any) => sum + (kpi.weight || 0), 0);
              const quarterlyWeight = quarterlyKPIs.reduce((sum: number, kpi: any) => sum + (kpi.weight || 0), 0);

              return (
                <div key={profile.user_id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{profile.name}</h4>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            📊 Annual: {annualKPIs.length} ({annualWeight}%)
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditKPIs(profile, 'annual')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            📈 Quarterly: {quarterlyKPIs.length} ({quarterlyWeight}%)
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditKPIs(profile, 'quarterly')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Show KPIs inline */}
                  {annualKPIs.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Annual KPIs:</p>
                      <div className="space-y-1">
                        {annualKPIs.map((kpi: any, idx: number) => (
                          <div key={idx} className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-blue-500" />
                            <span className="flex-1">{kpi.description}</span>
                            <Badge variant="secondary" className="text-xs">{kpi.weight}%</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No team members found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProfile && (
        <KPIManager
          open={kpiDialogOpen}
          onOpenChange={setKpiDialogOpen}
          kpis={kpiType === 'annual' ? (selectedProfile.kpis || []) : (selectedProfile.quarterly_kpis || [])}
          onSave={handleSaveKPIs}
          title={`${kpiType === 'annual' ? 'Annual' : 'Quarterly'} KPIs - ${selectedProfile.name}`}
        />
      )}
    </>
  );
}
