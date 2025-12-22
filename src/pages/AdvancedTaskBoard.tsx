import { useState, useMemo, useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/PageContainer";
import { AdvancedTaskFilters, AdvancedTaskFiltersState } from "@/components/tasks/AdvancedTaskFilters";
import { AdvancedTaskTable } from "@/components/tasks/AdvancedTaskTable";
import { AdvancedBulkActionsBar } from "@/components/tasks/AdvancedBulkActionsBar";
import { UnifiedTaskDialog } from "@/components/UnifiedTaskDialog";
import { 
  setTasksStatusBulk, 
  setPriorityBulk, 
  deleteTasksBulk,
  setLabelsBulk,
  addLabelsBulk,
  removeLabelsBulk,
  setDueDateBulk,
  setSprintBulk,
  setAssigneesBulk,
} from "@/domain/tasks/actions";

export default function AdvancedTaskBoard() {
  const { data: tasks = [], isLoading } = useTasks();
  const queryClient = useQueryClient();
  const { updateStatus, updatePriority } = useTaskMutations();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdvancedTaskFiltersState>({
    search: "",
    statuses: [],
    sprint: "",
    tags: [],
    assignees: [],
    priority: "",
  });

  // Extract unique sprints
  const sprints = useMemo(() => {
    const sprintSet = new Set<string>();
    tasks.forEach((t: any) => t.sprint && sprintSet.add(t.sprint));
    return Array.from(sprintSet).sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      // Search
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const key = `TSK-${task.id.slice(-6).toUpperCase()}`;
        if (!task.title?.toLowerCase().includes(search) && !key.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Status
      if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) {
        return false;
      }

      // Sprint
      if (filters.sprint && task.sprint !== filters.sprint) {
        return false;
      }

      // Tags
      if (filters.tags.length > 0) {
        const taskLabels = (task.labels || []) as string[];
        if (!filters.tags.some(t => taskLabels.includes(t))) {
          return false;
        }
      }

      // Assignees
      if (filters.assignees.length > 0) {
        const taskAssigneeIds = (task.assignees || []).map((a: any) => a.id);
        if (!filters.assignees.some(a => taskAssigneeIds.includes(a))) {
          return false;
        }
      }

      // Priority
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Get current tags on selected tasks
  const currentTagsOnSelected = useMemo(() => {
    const tagSet = new Set<string>();
    filteredTasks
      .filter((t: any) => selectedIds.has(t.id))
      .forEach((t: any) => {
        ((t.labels || []) as string[]).forEach(tag => tagSet.add(tag));
      });
    return Array.from(tagSet);
  }, [filteredTasks, selectedIds]);

  // Handlers
  const handleTaskClick = useCallback((taskId: string) => {
    setOpenTaskId(taskId);
  }, []);

  const handleStatusChange = useCallback((taskId: string, status: string) => {
    updateStatus.mutate({ id: taskId, status });
  }, [updateStatus]);

  const handlePriorityChange = useCallback((taskId: string, priority: string) => {
    updatePriority.mutate({ id: taskId, priority });
  }, [updatePriority]);

  const handleTagsChange = useCallback(async (taskId: string, tags: string[]) => {
    const result = await setLabelsBulk([taskId], tags);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } else {
      toast.error("Failed to update tags");
    }
  }, [queryClient]);

  // Bulk actions
  const handleBulkStatusChange = useCallback(async (status: string) => {
    const ids = Array.from(selectedIds);
    const result = await setTasksStatusBulk(ids, status);
    if (result.success) {
      toast.success(`Updated ${result.successCount} tasks`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedIds(new Set());
    } else {
      toast.error(`Failed to update ${result.failedCount} tasks`);
    }
  }, [selectedIds, queryClient]);

  const handleBulkPriorityChange = useCallback(async (priority: string) => {
    const ids = Array.from(selectedIds);
    const result = await setPriorityBulk(ids, priority as "Low" | "Medium" | "High");
    if (result.success) {
      toast.success(`Updated ${result.successCount} tasks`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedIds(new Set());
    } else {
      toast.error(`Failed to update ${result.failedCount} tasks`);
    }
  }, [selectedIds, queryClient]);

  const handleBulkAddTags = useCallback(async (tags: string[]) => {
    const ids = Array.from(selectedIds);
    const result = await addLabelsBulk(ids, tags);
    if (result.success) {
      toast.success(`Added tags to ${result.successCount} tasks`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedIds(new Set());
    } else {
      toast.error(`Failed to add tags to ${result.failedCount} tasks`);
    }
  }, [selectedIds, queryClient]);

  const handleBulkRemoveTags = useCallback(async (tags: string[]) => {
    const ids = Array.from(selectedIds);
    const result = await removeLabelsBulk(ids, tags);
    if (result.success) {
      toast.success(`Removed tags from ${result.successCount} tasks`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedIds(new Set());
    } else {
      toast.error(`Failed to remove tags from ${result.failedCount} tasks`);
    }
  }, [selectedIds, queryClient]);

  const handleBulkSetAssignees = useCallback(async (userIds: string[]) => {
    const ids = Array.from(selectedIds);
    const result = await setAssigneesBulk(ids, userIds);
    if (result.success) {
      toast.success(`Updated assignees for ${result.successCount} tasks`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedIds(new Set());
    } else {
      toast.error(`Failed to update ${result.failedCount} tasks`);
    }
  }, [selectedIds, queryClient]);

  const handleBulkSetDueDate = useCallback(async (date: string | null) => {
    const ids = Array.from(selectedIds);
    const result = await setDueDateBulk(ids, date);
    if (result.success) {
      toast.success(`Updated due date for ${result.successCount} tasks`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedIds(new Set());
    } else {
      toast.error(`Failed to update ${result.failedCount} tasks`);
    }
  }, [selectedIds, queryClient]);

  const handleBulkSetSprint = useCallback(async (sprint: string | null) => {
    const ids = Array.from(selectedIds);
    const result = await setSprintBulk(ids, sprint);
    if (result.success) {
      toast.success(`Updated sprint for ${result.successCount} tasks`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedIds(new Set());
    } else {
      toast.error(`Failed to update ${result.failedCount} tasks`);
    }
  }, [selectedIds, queryClient]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    const result = await deleteTasksBulk(ids);
    if (result.success) {
      toast.success(`Deleted ${result.successCount} tasks`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedIds(new Set());
    } else {
      toast.error(`Failed to delete ${result.failedCount} tasks`);
    }
  }, [selectedIds, queryClient]);

  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selectedIds);
    const result = await setTasksStatusBulk(ids, "Completed");
    if (result.success) {
      toast.success(`Archived ${result.successCount} tasks`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedIds(new Set());
    } else {
      toast.error(`Failed to archive ${result.failedCount} tasks`);
    }
  }, [selectedIds, queryClient]);

  const selectedTask = openTaskId ? tasks.find((t: any) => t.id === openTaskId) : null;

  return (
    <PageContainer size="wide" className="!p-0">
      {/* Page Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h1 className="text-heading-md font-semibold">Advanced Task Board</h1>
          <p className="text-metadata text-muted-foreground">
            {filteredTasks.length} tasks • {selectedIds.size} selected
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4">
        <AdvancedTaskFilters
          filters={filters}
          onChange={setFilters}
          sprints={sprints}
        />
      </div>

      {/* Table */}
      <div className="flex-1 px-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            Loading tasks...
          </div>
        ) : (
          <AdvancedTaskTable
            tasks={filteredTasks}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onTaskClick={handleTaskClick}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onTagsChange={handleTagsChange}
          />
        )}
      </div>

      {/* Bulk Actions Bar */}
      <AdvancedBulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onStatusChange={handleBulkStatusChange}
        onPriorityChange={handleBulkPriorityChange}
        onAddTags={handleBulkAddTags}
        onRemoveTags={handleBulkRemoveTags}
        onSetAssignees={handleBulkSetAssignees}
        onSetDueDate={handleBulkSetDueDate}
        onSetSprint={handleBulkSetSprint}
        onDelete={handleBulkDelete}
        onArchive={handleBulkArchive}
        sprints={sprints}
        currentTags={currentTagsOnSelected}
      />

      {/* Task Dialog */}
      {selectedTask && (
        <UnifiedTaskDialog
          open={!!openTaskId}
          onOpenChange={(open) => !open && setOpenTaskId(null)}
          task={selectedTask}
          mode="edit"
        />
      )}
    </PageContainer>
  );
}
