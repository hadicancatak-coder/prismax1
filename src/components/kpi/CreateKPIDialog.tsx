import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AssigneeMultiSelect } from "@/components/AssigneeMultiSelect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { KPIType, KPITarget } from "@/types/kpi";

interface CreateKPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

const CHANNEL_OPTIONS = ["PPC", "Social UA", "Performance Marketing", "SEO", "Email", "Content"];

export function CreateKPIDialog({ open, onOpenChange, onSubmit }: CreateKPIDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [type, setType] = useState<KPIType>("annual");
  const [period, setPeriod] = useState("");
  const [targets, setTargets] = useState<Partial<KPITarget>[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);

  // Fetch all users for assignment
  const { data: users } = useQuery({
    queryKey: ['users-for-kpi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, name, email')
        .order('name');
      if (error) throw error;
      return data.map(p => ({ user_id: p.id, name: p.name, username: p.email }));
    }
  });

  const addTarget = (targetType: 'channel' | 'custom') => {
    setTargets([...targets, {
      target_type: targetType,
      target_name: targetType === 'channel' ? CHANNEL_OPTIONS[0] : "",
      target_value: 0,
      current_value: 0,
      unit: "%",
    }]);
  };

  const updateTarget = (index: number, field: string, value: any) => {
    const updated = [...targets];
    updated[index] = { ...updated[index], [field]: value };
    setTargets(updated);
  };

  const removeTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const totalWeight = targets.reduce((sum, t) => sum + Number(weight), 0);
    if (totalWeight > 100) {
      alert("Total weight cannot exceed 100%");
      return;
    }

    onSubmit({
      name,
      description,
      weight: Number(weight),
      type,
      period,
      status: 'draft',
      targets,
      assignees,
    });

    // Reset form
    setName("");
    setDescription("");
    setWeight("");
    setPeriod("");
    setTargets([]);
    setAssignees([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New KPI</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>KPI Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Increase Conversion Rate"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (%) *</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="25"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the KPI objectives and measurement criteria..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as KPIType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period *</Label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g., Q1 2025, FY2025"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assign To (Optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Select users to assign this KPI to immediately upon creation
            </p>
            {users && (
              <AssigneeMultiSelect
                users={users}
                selectedUserIds={assignees}
                onSelectionChange={setAssignees}
                placeholder="Select users to assign..."
              />
            )}
          </div>

          {/* Targets Section */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label>Targets</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addTarget('channel')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Channel Target
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addTarget('custom')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Custom Target
                </Button>
              </div>
            </div>

            {targets.map((target, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {target.target_type === 'channel' ? 'Channel' : 'Custom'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTarget(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Target Name</Label>
                    {target.target_type === 'channel' ? (
                      <Select
                        value={target.target_name}
                        onValueChange={(v) => updateTarget(index, 'target_name', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNEL_OPTIONS.map((ch) => (
                            <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={target.target_name}
                        onChange={(e) => updateTarget(index, 'target_name', e.target.value)}
                        placeholder="e.g., Lead Generation"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Target Value</Label>
                    <Input
                      type="number"
                      value={target.target_value}
                      onChange={(e) => updateTarget(index, 'target_value', Number(e.target.value))}
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Current Value</Label>
                    <Input
                      type="number"
                      value={target.current_value}
                      onChange={(e) => updateTarget(index, 'current_value', Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={target.unit}
                      onValueChange={(v) => updateTarget(index, 'unit', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="%">%</SelectItem>
                        <SelectItem value="$">$</SelectItem>
                        <SelectItem value="count">Count</SelectItem>
                        <SelectItem value="leads">Leads</SelectItem>
                      </SelectContent>
                    </Select>
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
          <Button onClick={handleSubmit} disabled={!name || !weight || !period}>
            Create KPI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
