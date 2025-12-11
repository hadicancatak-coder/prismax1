import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, Key } from "lucide-react";
import { detectHeadlinePattern, getHeadlinePositionRecommendation } from "@/lib/adQualityScore";

interface SortableHeadlineInputProps {
  id: string;
  index: number;
  headline: string;
  isDkiEnabled: boolean;
  onUpdate: (value: string) => void;
  onToggleDki: () => void;
  renderActions: () => React.ReactNode;
}

export function SortableHeadlineInput({ 
  id, 
  index, 
  headline, 
  isDkiEnabled, 
  onUpdate, 
  onToggleDki,
  renderActions 
}: SortableHeadlineInputProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const pattern = detectHeadlinePattern(headline);
  const hasPattern = pattern.type !== 'none';
  const recommendation = getHeadlinePositionRecommendation(pattern.type, index);

  return (
    <div ref={setNodeRef} style={style} className="space-y-sm">
      <div className="flex gap-sm items-start">
        <div className="flex items-center gap-sm mt-sm">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-xs hover:bg-muted rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
            {index + 1}
          </Badge>
        </div>
        
        <div className="flex-1 space-y-sm">
          <Input
            placeholder={`Headline ${index + 1}${index < 3 ? ' *' : ''}`}
            value={headline}
            onChange={(e) => onUpdate(e.target.value)}
            maxLength={30}
            className={`${hasPattern ? 'ring-1 ring-warning/50' : ''} ${recommendation?.isOptimal ? 'ring-1 ring-success/50' : ''}`}
          />
          
          {index < 3 && (
            <div className="flex items-center gap-sm">
              <Checkbox 
                id={`dki-${index}`}
                checked={isDkiEnabled}
                onCheckedChange={onToggleDki}
              />
              <Label htmlFor={`dki-${index}`} className="text-metadata flex items-center gap-xs cursor-pointer">
                <Key className="h-3 w-3" />
                Use Dynamic Keyword Insertion
              </Label>
            </div>
          )}
          
          {recommendation && (
            <div className={`text-metadata p-sm rounded ${recommendation.isOptimal ? 'bg-success-soft text-success-text border border-success/30' : 'bg-info-soft text-info-text border border-info/30'}`}>
              {recommendation.isOptimal ? '✨ ' : '💡 '}{recommendation.message}
            </div>
          )}
        </div>
        
        <div className="flex items-start gap-sm mt-sm">
          {isDkiEnabled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="cursor-help">
                    🔑 DKI
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-body-sm max-w-xs">Google will insert the user's search query here. Fallback: "{headline}"</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {hasPattern && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="text-metadata cursor-help bg-warning-soft border-warning/30 text-warning-text"
                  >
                    {pattern.indicator} +{pattern.boost}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-body-sm">{pattern.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {renderActions()}
        </div>
      </div>
    </div>
  );
}
