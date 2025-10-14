import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { CheckSquare, Plus, Trash2 } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskChecklistSectionProps {
  taskId: string;
  initialChecklist?: ChecklistItem[];
  onUpdate?: () => void;
}

export function TaskChecklistSection({ taskId, initialChecklist = [], onUpdate }: TaskChecklistSectionProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    setChecklist(initialChecklist);
  }, [initialChecklist]);

  const saveChecklist = async (updatedChecklist: ChecklistItem[]) => {
    const { error } = await supabase
      .from("tasks")
      .update({ checklist: updatedChecklist as any })
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setChecklist(updatedChecklist);
      onUpdate?.();
    }
  };

  const addItem = async () => {
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText,
      completed: false,
    };

    await saveChecklist([...checklist, newItem]);
    setNewItemText("");
  };

  const toggleItem = async (itemId: string) => {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await saveChecklist(updated);
  };

  const removeItem = async (itemId: string) => {
    const updated = checklist.filter((item) => item.id !== itemId);
    await saveChecklist(updated);
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          <h3 className="font-semibold">Checklist</h3>
        </div>
        {checklist.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {completedCount}/{checklist.length} completed
          </span>
        )}
      </div>

      {checklist.length > 0 && (
        <Progress value={progress} className="h-2" />
      )}

      <div className="space-y-2">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => toggleItem(item.id)}
            />
            <span
              className={`flex-1 text-sm ${
                item.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {item.text}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeItem(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add checklist item..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button onClick={addItem} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
