import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface WorkspaceCardProps {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  boardCount?: number;
  onClick?: () => void;
}

export function WorkspaceCard({ 
  name, 
  description, 
  icon = "Folder", 
  color = "#3B82F6",
  boardCount = 0,
  onClick 
}: WorkspaceCardProps) {
  const navigate = useNavigate();
  const Icon = (Icons[icon as keyof typeof Icons] as LucideIcon) || Icons.Folder;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all group"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div 
            className="p-3 rounded-lg group-hover:scale-110 transition-transform"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {boardCount} {boardCount === 1 ? 'board' : 'boards'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <CardTitle className="text-lg group-hover:text-primary transition-smooth">
          {name}
        </CardTitle>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
