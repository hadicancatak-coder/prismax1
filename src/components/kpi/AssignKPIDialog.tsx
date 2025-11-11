import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TeamKPI } from "@/types/kpi";

interface AssignKPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: TeamKPI | null;
  onAssign: (assignments: any[]) => void;
}

const TEAMS = ["SocialUA", "PPC", "PerMar"];

export function AssignKPIDialog({ open, onOpenChange, kpi, onAssign }: AssignKPIDialogProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUsers([]);
      setSelectedTeams([]);
      setNotes("");
    }
  }, [open]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, name, avatar_url, email, teams")
      .order("name");

    if (data) setUsers(data);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
  };

  const handleAssign = () => {
    if (!kpi || (!selectedUsers.length && !selectedTeams.length)) return;

    const assignments = [
      ...selectedUsers.map((userId) => ({
        kpi_id: kpi.id,
        user_id: userId,
        team_name: null,
        assigned_by: user?.id,
        status: 'pending',
        notes,
      })),
      ...selectedTeams.map((team) => ({
        kpi_id: kpi.id,
        user_id: null,
        team_name: team,
        assigned_by: user?.id,
        status: 'pending',
        notes,
      })),
    ];

    onAssign(assignments);
    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!kpi) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Assign KPI: {kpi.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Individual Users</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                    onClick={() => toggleUser(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {user.teams && user.teams.length > 0 && (
                      <div className="flex gap-1">
                        {user.teams.map((team: string) => (
                          <Badge key={team} variant="secondary" className="text-xs">
                            {team}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <div className="space-y-2">
              {TEAMS.map((team) => (
                <div
                  key={team}
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent cursor-pointer"
                  onClick={() => toggleTeam(team)}
                >
                  <Checkbox
                    checked={selectedTeams.includes(team)}
                    onCheckedChange={() => toggleTeam(team)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{team}</p>
                    <p className="text-sm text-muted-foreground">
                      {users.filter((u) => u.teams?.includes(team)).length} members
                    </p>
                  </div>
                  <Badge variant="outline">{team}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes or context for this assignment..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUsers.length && !selectedTeams.length}
          >
            Assign to {selectedUsers.length + selectedTeams.length} {selectedUsers.length + selectedTeams.length === 1 ? 'assignee' : 'assignees'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
