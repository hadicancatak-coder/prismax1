import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ListChecks, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface ConvertAllToTaskButtonProps {
  auditLogId: string;
  title: string;
  description?: string;
  entity?: string[];
  deadline?: string;
  items: Array<{ id: string; content: string; status: string }>;
  assignees?: string[];
}

export function ConvertAllToTaskButton({
  auditLogId,
  title,
  description,
  entity,
  deadline,
  items,
  assignees = [],
}: ConvertAllToTaskButtonProps) {
  const [isConverting, setIsConverting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleConvertAll = async () => {
    if (!user || items.length === 0) return;

    setIsConverting(true);
    try {
      // Create the task with checklist
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert([{
          title: title,
          description: description || "",
          status: "Pending",
          priority: "Medium",
          entity: entity || [],
          due_at: deadline || null,
          created_by: user.id,
          visibility: "global",
          checklist: items.map((item, index) => ({
            id: item.id,
            text: item.content,
            completed: item.status === 'completed',
          })),
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      // Add assignees
      if (assignees.length > 0) {
        const { error: assignError } = await supabase
          .from("task_assignees")
          .insert(
            assignees.map((assigneeId) => ({
              task_id: task.id,
              user_id: assigneeId,
            }))
          );

        if (assignError) throw assignError;
      }

      // Link all operation items to the task
      const { error: linkError } = await supabase
        .from("operation_audit_item_comments")
        .update({ task_id: task.id })
        .in('id', items.map(i => i.id));

      if (linkError) throw linkError;

      // Link the audit log to the task
      const { error: auditError } = await supabase
        .from("operation_audit_logs")
        .update({ task_id: task.id })
        .eq('id', auditLogId);

      if (auditError) throw auditError;

      toast.success(`Task created with ${items.length} checklist items`);
      queryClient.invalidateQueries({ queryKey: ["operation-log", auditLogId] });
      queryClient.invalidateQueries({ queryKey: ["operation-items", auditLogId] });
    } catch (error) {
      console.error("Error converting to task:", error);
      toast.error("Failed to convert to task");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Button
      onClick={handleConvertAll}
      disabled={isConverting || items.length === 0}
      variant="outline"
      size="sm"
    >
      {isConverting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <ListChecks className="h-4 w-4 mr-2" />
      )}
      Convert All to Task
    </Button>
  );
}
