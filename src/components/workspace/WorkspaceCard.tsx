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
      className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group bg-white border border-gray-200"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-8 w-8" style={{ color }} />
          </div>
          <div className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
            {boardCount} {boardCount === 1 ? 'board' : 'boards'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
          {name}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
