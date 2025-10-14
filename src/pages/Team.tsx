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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Phone, Users, Search, Edit } from "lucide-react";
import { TEAMS } from "@/lib/constants";

export default function Team() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = profiles.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.teams?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchQuery, profiles]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name");

      if (error) throw error;
      setProfiles(data || []);
      setFilteredProfiles(data || []);
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Team Directory</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, title, or team..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map((profile) => (
          <Card 
            key={profile.user_id} 
            className="p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] relative"
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
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-lg">
                  {profile.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              
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
            {searchQuery ? "No team members match your search" : "No team members found"}
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
