import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useKPIs } from "@/hooks/useKPIs";
import { useAuth } from "@/hooks/useAuth";
import type { TeamKPI, KPITarget } from "@/types/kpi";

interface CreateKPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingKPI?: TeamKPI | null;
}

export function CreateKPIDialog({ open, onOpenChange, editingKPI }: CreateKPIDialogProps) {
  const { createKPI, updateKPI } = useKPIs();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(100);
  const [type, setType] = useState<"annual" | "quarterly">("annual");
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [targets, setTargets] = useState<Partial<KPITarget>[]>([
    { target_type: "channel", target_name: "", target_value: 0, current_value: 0, unit: "" }
  ]);

  useEffect(() => {
    if (editingKPI) {
      setName(editingKPI.name);
      setDescription(editingKPI.description || "");
      setWeight(editingKPI.weight);
      setType(editingKPI.type);
      setPeriod(editingKPI.period);
      setStatus(editingKPI.status as "draft" | "active");
      if (editingKPI.targets && editingKPI.targets.length > 0) {
        setTargets(editingKPI.targets);
      }
    } else {
      resetForm();
    }
  }, [editingKPI, open]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setWeight(100);
    setType("annual");
    setPeriod("");
    setStatus("draft");
    setTargets([{ target_type: "channel", target_name: "", target_value: 0, current_value: 0, unit: "" }]);
  };

  const totalTargetsWeight = targets.reduce((sum, t) => sum + (t.target_value || 0), 0);
  const remainingWeight = 100 - weight;

  const handleAddTarget = () => {
    setTargets([...targets, { target_type: "channel", target_name: "", target_value: 0, current_value: 0, unit: "" }]);
  };

  const handleRemoveTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const handleTargetChange = (index: number, field: keyof KPITarget, value: any) => {
    const newTargets = [...targets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    setTargets(newTargets);
  };

  const handleSubmit = () => {
    if (!user) return;

    if (editingKPI) {
      updateKPI.mutate({ 
        id: editingKPI.id,
        name,
        description: description || null,
        weight,
        type,
        period,
        status,
      });
    } else {
      createKPI.mutate({
        name,
        description: description || null,
        weight,
        type,
        period,
        status,
        created_by: user.id,
        targets,
      } as any);
    }

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingKPI ? "Edit KPI" : "Create New KPI"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-md">
          <div className="space-y-sm">
            <Label htmlFor="name">KPI Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Increase conversion rate"
            />
          </div>

          <div className="space-y-sm">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the KPI objectives and methodology..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-sm">
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as "annual" | "quarterly")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-sm">
              <Label htmlFor="period">Period *</Label>
              <Input
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g., 2024 or Q1 2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-sm">
              <div className="flex items-center justify-between">
                <Label htmlFor="weight">Weight (%) *</Label>
                <Badge variant={weight > 100 ? "destructive" : remainingWeight < 0 ? "destructive" : "secondary"} className="text-metadata">
                  {weight > 100 ? "Exceeds 100%" : `${remainingWeight}% remaining`}
                </Badge>
              </div>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                min={0}
                max={100}
                className={weight > 100 ? "border-destructive" : ""}
              />
              {weight > 100 && (
                <p className="text-metadata text-destructive">Weight cannot exceed 100%</p>
              )}
            </div>

            <div className="space-y-sm">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "active")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-sm pt-md border-t">
            <div className="flex items-center justify-between">
              <Label>Targets</Label>
              <Button variant="outline" size="sm" onClick={handleAddTarget}>
                <Plus className="h-4 w-4 mr-sm" />
                Add Target
              </Button>
            </div>

            {targets.map((target, index) => (
              <div key={index} className="p-sm border rounded-lg space-y-sm">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-medium">Target {index + 1}</span>
                  {targets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTarget(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-sm">
                  <div className="space-y-sm">
                    <Label>Type</Label>
                    <Select
                      value={target.target_type}
                      onValueChange={(v) => handleTargetChange(index, "target_type", v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="channel">Channel</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-sm">
                    <Label>Name</Label>
                    <Input
                      className="h-8"
                      value={target.target_name}
                      onChange={(e) => handleTargetChange(index, "target_name", e.target.value)}
                      placeholder="Target name"
                    />
                  </div>

                  <div className="space-y-sm">
                    <Label>Target Value</Label>
                    <Input
                      className="h-8"
                      type="number"
                      value={target.target_value}
                      onChange={(e) => handleTargetChange(index, "target_value", Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-sm">
                    <Label>Current Value</Label>
                    <Input
                      className="h-8"
                      type="number"
                      value={target.current_value}
                      onChange={(e) => handleTargetChange(index, "current_value", Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-sm col-span-2">
                    <Label>Unit</Label>
                    <Input
                      className="h-8"
                      value={target.unit}
                      onChange={(e) => handleTargetChange(index, "unit", e.target.value)}
                      placeholder="e.g., %, $, conversions"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !period}>
            {editingKPI ? "Update KPI" : "Create KPI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
