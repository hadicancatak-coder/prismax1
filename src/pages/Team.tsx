import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Phone, Users, Search, Edit, Grid3x3, List, Download } from "lucide-react";
import { TEAMS } from "@/lib/constants";

export default function Team() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("name");

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [profiles, searchQuery, teamFilter, sortBy]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
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

  const applyFiltersAndSort = () => {
    let filtered = [...profiles];

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.teams?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply team filter
    if (teamFilter !== "all") {
      filtered = filtered.filter(p => p.teams?.includes(teamFilter));
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "team") {
        const aTeam = a.teams?.[0] || "";
        const bTeam = b.teams?.[0] || "";
        return aTeam.localeCompare(bTeam);
      }
      return 0;
    });

    setFilteredProfiles(filtered);
  };

  const handleEditTeams = (profile: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProfile(profile);
    setSelectedTeams(profile.teams || []);
    setEditDialogOpen(true);
  };

  const toggleTeam = (team: string) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const handleSaveTeams = async () => {
    if (!selectedProfile) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ teams: selectedTeams as any })
        .eq("user_id", selectedProfile.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Teams updated successfully",
      });

      setEditDialogOpen(false);
      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Title", "Phone", "Teams", "Scope of Work"];
    const rows = filteredProfiles.map((p) => [
      p.name || "",
      p.email || "",
      p.title || "",
      p.phone_number || "",
      p.teams?.join(", ") || "",
      p.scope_of_work || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-members-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Team Directory</h1>
          <p className="text-muted-foreground text-sm">
            Connect with your team members ({filteredProfiles.length} members)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === "admin" && (
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  Grid
                </div>
              </SelectItem>
              <SelectItem value="list">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  List
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, title, or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {TEAMS.map((team) => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="title">Sort by Title</SelectItem>
            <SelectItem value="team">Sort by Team</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {filteredProfiles.map((profile) => (
          <Card 
            key={profile.user_id} 
            className={`p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] relative ${
              viewMode === "list" ? "flex items-center gap-6" : ""
            }`}
            onClick={() => navigate(`/profile/${profile.user_id}`)}
          >
            {userRole === 'admin' && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={(e) => handleEditTeams(profile, e)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <div className={`flex items-start gap-4 ${viewMode === "list" ? "flex-1" : ""}`}>
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {profile.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" title="Online" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-foreground truncate">
                  {profile.name}
                </h3>
                
                {profile.title && (
                  <p className="text-sm text-muted-foreground mb-2">{profile.title}</p>
                )}
                
                {profile.tagline && (
                  <p className="text-sm text-foreground/80 mb-3 italic">
                    "{profile.tagline}"
                  </p>
                )}

                {profile.scope_of_work && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {profile.scope_of_work}
                  </p>
                )}
                
                <div className="space-y-2">
                  {profile.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <a 
                        href={`mailto:${profile.email}`}
                        className="hover:text-primary hover:underline truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {profile.email}
                      </a>
                    </div>
                  )}
                  
                  {profile.phone_number && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <a 
                        href={`tel:${profile.phone_number}`}
                        className="hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {profile.phone_number}
                      </a>
                    </div>
                  )}
                </div>
                
                {profile.teams && profile.teams.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.teams.map((team: string) => (
                      <Badge key={team} variant="secondary" className="text-xs">
                        {team}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {profile.working_days && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Working: {profile.working_days}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {filteredProfiles.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchQuery || teamFilter !== "all" ? "No team members match your filters" : "No team members found"}
          </p>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Teams</DialogTitle>
            <DialogDescription>
              Assign teams to {selectedProfile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {TEAMS.map((team) => (
                <div key={team} className="flex items-center space-x-2">
                  <Checkbox
                    id={`team-${team}`}
                    checked={selectedTeams.includes(team)}
                    onCheckedChange={() => toggleTeam(team)}
                  />
                  <Label 
                    htmlFor={`team-${team}`} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {team}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTeams}>
                Save Teams
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
