import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SystemEntity } from "@/hooks/useSystemEntities";

interface CustomizeShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allEntities: SystemEntity[];
  selectedEntityIds: string[];
  onSave: (entityIds: string[]) => void;
}

const SortableEntityItem = ({
  entity,
  isSelected,
  onToggle,
}: {
  entity: SystemEntity;
  isSelected: boolean;
  onToggle: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entity.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-sm p-sm rounded-lg border bg-card hover:bg-accent transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <Checkbox id={entity.id} checked={isSelected} onCheckedChange={onToggle} />
      <Label
        htmlFor={entity.id}
        className="flex items-center gap-sm flex-1 cursor-pointer"
      >
        <span className="text-xl">{entity.emoji || "📋"}</span>
        <span>{entity.name}</span>
      </Label>
    </div>
  );
};

export const CustomizeShortcutsDialog = ({
  open,
  onOpenChange,
  allEntities,
  selectedEntityIds,
  onSave,
}: CustomizeShortcutsDialogProps) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedEntityIds);
  const [orderedEntities, setOrderedEntities] = useState<SystemEntity[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setLocalSelected(selectedEntityIds);
    
    // Order entities: selected first (in saved order), then unselected
    const selected = selectedEntityIds
      .map(id => allEntities.find(e => e.id === id))
      .filter(Boolean) as SystemEntity[];
    
    const unselected = allEntities.filter(e => !selectedEntityIds.includes(e.id));
    
    setOrderedEntities([...selected, ...unselected]);
  }, [selectedEntityIds, allEntities, open]);

  const handleToggle = (entityId: string) => {
    setLocalSelected((prev) => {
      if (prev.includes(entityId)) {
        return prev.filter((id) => id !== entityId);
      } else {
        if (prev.length >= 8) {
          return prev; // Max 8 shortcuts
        }
        return [...prev, entityId];
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedEntities((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    // Save in the order they appear, but only selected ones
    const orderedSelected = orderedEntities
      .filter(e => localSelected.includes(e.id))
      .map(e => e.id);
    
    onSave(orderedSelected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize Entity Shortcuts</DialogTitle>
          <DialogDescription>
            Select up to 8 entities to display as quick filters. Drag to reorder.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={orderedEntities.map(e => e.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-sm">
                {orderedEntities.map((entity) => (
                  <SortableEntityItem
                    key={entity.id}
                    entity={entity}
                    isSelected={localSelected.includes(entity.id)}
                    onToggle={() => handleToggle(entity.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>

        <div className="text-body-sm text-muted-foreground">
          {localSelected.length} / 8 shortcuts selected
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
