import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface User {
  user_id: string;
  name: string;
  username?: string;
  teams?: string[];
}

interface AssigneeFilterBarProps {
  selectedAssignees: string[];
  selectedTeams: string[];
  onAssigneesChange: (assignees: string[]) => void;
  onTeamsChange: (teams: string[]) => void;
}

export function AssigneeFilterBar({
  selectedAssignees,
  selectedTeams,
  onAssigneesChange,
  onTeamsChange,
}: AssigneeFilterBarProps) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, username, teams");
    setUsers(data || []);
  };

  const toggleAssignee = (userId: string) => {
    if (selectedAssignees.includes(userId)) {
      onAssigneesChange(selectedAssignees.filter((id) => id !== userId));
    } else {
      onAssigneesChange([...selectedAssignees, userId]);
    }
  };

  const toggleTeam = (team: string) => {
    if (selectedTeams.includes(team)) {
      onTeamsChange(selectedTeams.filter((t) => t !== team));
    } else {
      onTeamsChange([...selectedTeams, team]);
    }
  };

  const clearAssigneeFilters = () => {
    onAssigneesChange([]);
  };

  const clearTeamFilters = () => {
    onTeamsChange([]);
  };

  const selectedUserNames = users
    .filter((u) => selectedAssignees.includes(u.user_id))
    .map((u) => u.username || u.name);

  const teams = ["SocialUA", "PPC", "PerMar"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="mb-2 block">Filter by Assignee</Label>
        <Select
          value={selectedAssignees.length > 0 ? "selected" : "all"}
          onValueChange={(value) => {
            if (value === "all") clearAssigneeFilters();
          }}
        >
          <SelectTrigger className="bg-background">
            <SelectValue>
              {selectedAssignees.length > 0
                ? `${selectedAssignees.length} selected`
                : "All Assignees"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All Assignees</SelectItem>
            {users.map((user) => (
              <div
                key={user.user_id}
                onClick={(e) => {
                  e.preventDefault();
                  toggleAssignee(user.user_id);
                }}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedAssignees.includes(user.user_id)}
                  onChange={() => {}}
                  className="cursor-pointer"
                />
                <span>{user.username || user.name}</span>
              </div>
            ))}
          </SelectContent>
        </Select>
        {selectedUserNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedUserNames.map((name) => (
              <Badge key={name} variant="secondary" className="gap-1 text-xs">
                {name}
                <button
                  onClick={() => {
                    const user = users.find(
                      (u) => u.username === name || u.name === name
                    );
                    if (user) toggleAssignee(user.user_id);
                  }}
                  className="hover:bg-background/50 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="mb-2 block">Filter by Team</Label>
        <Select
          value={selectedTeams.length > 0 ? "selected" : "all"}
          onValueChange={(value) => {
            if (value === "all") clearTeamFilters();
          }}
        >
          <SelectTrigger className="bg-background">
            <SelectValue>
              {selectedTeams.length > 0
                ? `${selectedTeams.length} selected`
                : "All Teams"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <div
                key={team}
                onClick={(e) => {
                  e.preventDefault();
                  toggleTeam(team);
                }}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(team)}
                  onChange={() => {}}
                  className="cursor-pointer"
                />
                <span>{team}</span>
              </div>
            ))}
          </SelectContent>
        </Select>
        {selectedTeams.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedTeams.map((team) => (
              <Badge key={team} variant="secondary" className="gap-1 text-xs">
                {team}
                <button
                  onClick={() => toggleTeam(team)}
                  className="hover:bg-background/50 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}