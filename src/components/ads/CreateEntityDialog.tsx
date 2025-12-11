import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateEntityPreset } from "@/hooks/useEntityPresets";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface CreateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateEntityDialog({ open, onOpenChange, onSuccess }: CreateEntityDialogProps) {
  const [presetName, setPresetName] = useState("");
  const [entities, setEntities] = useState<string[]>([""]);
  const createPreset = useCreateEntityPreset();

  const handleAddEntity = () => {
    setEntities([...entities, ""]);
  };

  const handleRemoveEntity = (index: number) => {
    setEntities(entities.filter((_, i) => i !== index));
  };

  const handleEntityChange = (index: number, value: string) => {
    const newEntities = [...entities];
    newEntities[index] = value;
    setEntities(newEntities);
  };

  const handleSubmit = async () => {
    const validEntities = entities.filter(e => e.trim() !== "");
    
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    
    if (validEntities.length === 0) {
      toast.error("Please add at least one entity");
      return;
    }

    await createPreset.mutateAsync({
      name: presetName,
      entities: validEntities
    });

    setPresetName("");
    setEntities([""]);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Entity Preset</DialogTitle>
        </DialogHeader>

        <div className="space-y-md py-md">
          <div className="space-y-sm">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g., My Entities"
            />
          </div>

          <div className="space-y-sm">
            <div className="flex items-center justify-between">
              <Label>Entities</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddEntity}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Entity
              </Button>
            </div>
            
            <div className="space-y-sm">
              {entities.map((entity, index) => (
                <div key={index} className="flex gap-sm">
                  <Input
                    value={entity}
                    onChange={(e) => handleEntityChange(index, e.target.value)}
                    placeholder="Entity name"
                  />
                  {entities.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEntity(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createPreset.isPending}>
            {createPreset.isPending ? "Creating..." : "Create Preset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
