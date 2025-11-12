import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertBanner } from "@/components/ui/AlertBanner";

export interface KPI {
  id: string;
  description: string;
  weight: number;
  timeline: string;
}

interface KPIManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpis: KPI[];
  onSave: (kpis: KPI[]) => void;
  title: string;
}

export function KPIManager({ open, onOpenChange, kpis, onSave, title }: KPIManagerProps) {
  const [localKPIs, setLocalKPIs] = useState<KPI[]>(kpis);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync local state with props when dialog opens or kpis change
  useEffect(() => {
    setLocalKPIs(Array.isArray(kpis) ? kpis : []);
    setValidationError(null);
  }, [kpis, open]);

  const addKPI = () => {
    setLocalKPIs([
      ...localKPIs,
      {
        id: crypto.randomUUID(),
        description: "",
        weight: 0,
        timeline: "",
      },
    ]);
  };

  const updateKPI = (id: string, field: keyof KPI, value: string | number) => {
    setLocalKPIs(
      localKPIs.map((kpi) =>
        kpi.id === id ? { ...kpi, [field]: value } : kpi
      )
    );
  };

  const removeKPI = (id: string) => {
    setLocalKPIs(localKPIs.filter((kpi) => kpi.id !== id));
  };

  const handleSave = () => {
    // Filter out empty KPIs and validate weights
    const validKPIs = Array.isArray(localKPIs) 
      ? localKPIs.filter((kpi) => kpi.description.trim() !== "" && kpi.weight > 0)
      : [];
    
    const totalWeight = validKPIs.reduce((sum, kpi) => sum + kpi.weight, 0);
    
    if (totalWeight > 100) {
      setValidationError("Total weight cannot exceed 100%");
      return;
    }
    
    onSave(validKPIs);
    onOpenChange(false);
  };

  const totalWeight = Array.isArray(localKPIs) 
    ? localKPIs.reduce((sum, kpi) => sum + Number(kpi.weight || 0), 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription>
            Manage your Key Performance Indicators. Total weight must not exceed 100%.
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Total Weight:</span>
            <Badge variant={totalWeight > 100 ? "destructive" : "secondary"}>
              {totalWeight}%
            </Badge>
            <span className="text-xs text-muted-foreground">
              {totalWeight > 100 ? "(Exceeds 100%)" : "(of 100%)"}
            </span>
          </div>
        </DialogHeader>

        {validationError && (
          <AlertBanner
            variant="error"
            message={validationError}
            onDismiss={() => setValidationError(null)}
          />
        )}

        <div className="space-y-4 py-4">
          {localKPIs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No KPIs defined yet.</p>
              <p className="text-sm mt-2">Click "Add KPI" to get started.</p>
            </div>
          ) : (
            localKPIs.map((kpi, index) => (
              <div
                key={kpi.id}
                className="p-4 border border-border rounded-lg space-y-3 bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        KPI #{index + 1}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => removeKPI(kpi.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`desc-${kpi.id}`}>Description</Label>
                      <Textarea
                        id={`desc-${kpi.id}`}
                        placeholder="Describe this KPI..."
                        value={kpi.description}
                        onChange={(e) =>
                          updateKPI(kpi.id, "description", e.target.value)
                        }
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`weight-${kpi.id}`}>Weight (%)</Label>
                        <Input
                          id={`weight-${kpi.id}`}
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g., 25"
                          value={kpi.weight || ""}
                          onChange={(e) =>
                            updateKPI(kpi.id, "weight", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`timeline-${kpi.id}`}>Timeline</Label>
                        <Input
                          id={`timeline-${kpi.id}`}
                          placeholder="e.g., Q1 2025"
                          value={kpi.timeline}
                          onChange={(e) =>
                            updateKPI(kpi.id, "timeline", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          <Button
            variant="outline"
            onClick={addKPI}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add KPI
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save KPIs</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
