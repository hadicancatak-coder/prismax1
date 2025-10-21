import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const AVAILABLE_TEAMS = ['SocialUA', 'PPC', 'PerMar'] as const;

interface TeamsMultiSelectProps {
  selectedTeams: string[];
  onChange: (teams: string[]) => void;
  disabled?: boolean;
}

export function TeamsMultiSelect({ selectedTeams, onChange, disabled }: TeamsMultiSelectProps) {
  const handleToggle = (team: string) => {
    if (selectedTeams.includes(team)) {
      onChange(selectedTeams.filter(t => t !== team));
    } else {
      onChange([...selectedTeams, team]);
    }
  };

  return (
    <div className="flex gap-3">
      {AVAILABLE_TEAMS.map(team => (
        <div key={team} className="flex items-center space-x-2">
          <Checkbox
            id={`team-${team}`}
            checked={selectedTeams.includes(team)}
            onCheckedChange={() => handleToggle(team)}
            disabled={disabled}
          />
          <Label htmlFor={`team-${team}`} className="text-sm cursor-pointer font-normal">
            {team}
          </Label>
        </div>
      ))}
    </div>
  );
}
