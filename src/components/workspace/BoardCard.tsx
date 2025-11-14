import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface BoardCardProps {
  id: string;
  name: string;
  description: string;
  route: string;
  icon?: string;
  color?: string;
  isStarred?: boolean;
  stats?: string;
  lastUpdated?: string;
  onStarToggle?: (id: string) => void;
}

export function BoardCard({ 
  id,
  name, 
  description, 
  route,
  icon = "FileText", 
  color,
  isStarred = false,
  stats,
  lastUpdated,
  onStarToggle
}: BoardCardProps) {
  const navigate = useNavigate();
  const [starred, setStarred] = useState(isStarred);
  const Icon = (Icons[icon as keyof typeof Icons] as LucideIcon) || Icons.FileText;

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStarred(!starred);
    onStarToggle?.(id);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all group relative"
      onClick={() => navigate(route)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg group-hover:scale-110 transition-transform"
              style={{ backgroundColor: color ? `${color}15` : 'hsl(var(--muted))' }}
            >
              <Icon className="h-5 w-5" style={{ color: color || 'hsl(var(--foreground))' }} />
            </div>
            <div>
              <CardTitle className="text-base group-hover:text-primary transition-smooth">
                {name}
              </CardTitle>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleStarClick}
          >
            <Star 
              className={`h-4 w-4 ${starred ? 'fill-yellow-400 text-yellow-400' : ''}`} 
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <CardDescription className="text-xs line-clamp-2">
          {description}
        </CardDescription>
        <div className="flex items-center justify-between pt-2">
          {stats && (
            <Badge variant="secondary" className="text-xs">
              {stats}
            </Badge>
          )}
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {lastUpdated}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
