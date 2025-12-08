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
      className="card-glow cursor-pointer hover:bg-card-hover transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,82,204,0.3)]"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-medium">
            {boardCount} {boardCount === 1 ? 'board' : 'boards'}
          </div>
        </div>
        <CardTitle className="text-base font-semibold text-foreground mb-2">
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
