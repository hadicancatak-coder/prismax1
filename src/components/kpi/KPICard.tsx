import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Target } from "lucide-react";
import type { TeamKPI } from "@/types/kpi";

interface KPICardProps {
  kpi: TeamKPI & { targets?: any[]; assignments?: any[] };
  onEdit?: (kpi: TeamKPI) => void;
  onDelete?: (id: string) => void;
  onAssign?: (kpi: TeamKPI) => void;
  readOnly?: boolean;
}

export function KPICard({ kpi, onEdit, onDelete, onAssign, readOnly }: KPICardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending_approval': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'draft': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const assignmentCount = kpi.assignments?.length || 0;
  const targetCount = kpi.targets?.length || 0;

  return (
    <Card className="p-6 hover:shadow-md transition-all">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold">{kpi.name}</h3>
              <Badge variant="outline" className={getStatusColor(kpi.status)}>
                {kpi.status.replace('_', ' ')}
              </Badge>
              <Badge variant="secondary">{kpi.type}</Badge>
            </div>
            {kpi.description && (
              <p className="text-sm text-muted-foreground">{kpi.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-medium">Weight: {kpi.weight}%</span>
              <span>Period: {kpi.period}</span>
            </div>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              {onEdit && (
                <Button size="sm" variant="ghost" onClick={() => onEdit(kpi)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onDelete(kpi.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Targets Section */}
        {kpi.targets && kpi.targets.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Targets</span>
            </div>
            {kpi.targets.map((target) => {
              const progress = target.target_value > 0 
                ? (target.current_value / target.target_value) * 100 
                : 0;
              
              return (
                <div key={target.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{target.target_name}</span>
                    <span className="text-muted-foreground">
                      {target.current_value} / {target.target_value} {target.unit}
                    </span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                </div>
              );
            })}
          </div>
        )}

        {/* Assignment Info */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{assignmentCount} {assignmentCount === 1 ? 'assignment' : 'assignments'}</span>
            {targetCount > 0 && (
              <>
                <span>•</span>
                <span>{targetCount} {targetCount === 1 ? 'target' : 'targets'}</span>
              </>
            )}
          </div>
          {!readOnly && onAssign && (
            <Button size="sm" variant="outline" onClick={() => onAssign(kpi)}>
              <Users className="h-4 w-4 mr-2" />
              Assign
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
