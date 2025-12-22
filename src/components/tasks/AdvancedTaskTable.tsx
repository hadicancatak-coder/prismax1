import { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TagsMultiSelect } from "./TagsMultiSelect";
import { TASK_STATUS_OPTIONS, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/domain";
import { TASK_TAGS } from "@/lib/constants";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  sprint?: string | null;
  labels?: string[] | null;
  due_at?: string | null;
  created_at: string;
  assignees?: Array<{ id: string; name: string; avatar_url?: string | null }>;
}

interface AdvancedTaskTableProps {
  tasks: Task[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onPriorityChange: (taskId: string, priority: string) => void;
  onTagsChange: (taskId: string, tags: string[]) => void;
}

const ROW_HEIGHT = 40;
const VIRTUALIZE_THRESHOLD = 200;

// Generate short task key from UUID
const getTaskKey = (id: string) => `TSK-${id.slice(-6).toUpperCase()}`;

// Get tag style
const getTagStyle = (tag: string) => {
  const predefined = TASK_TAGS.find(t => t.value === tag.toLowerCase());
  return predefined?.color || "bg-muted text-muted-foreground border-border";
};

// Status colors per spec
const STATUS_COLORS: Record<string, string> = {
  "Backlog": "bg-muted text-muted-foreground",
  "Ongoing": "bg-info/15 text-info",
  "Blocked": "bg-destructive/15 text-destructive",
  "Completed": "bg-success/15 text-success",
  "Failed": "bg-destructive/15 text-destructive",
};

// Priority icons
const PRIORITY_ICONS: Record<string, string> = {
  "High": "🔴",
  "Medium": "🟠",
  "Low": "🟢",
};

// Table Row Component
const TaskRow = memo(function TaskRow({
  task,
  isSelected,
  onSelect,
  onTaskClick,
  onStatusChange,
  onPriorityChange,
  onTagsChange,
  style,
}: {
  task: Task;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onTaskClick: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onPriorityChange: (id: string, priority: string) => void;
  onTagsChange: (id: string, tags: string[]) => void;
  style?: React.CSSProperties;
}) {
  const [tagsOpen, setTagsOpen] = useState(false);
  
  const isOverdue = task.due_at && isPast(parseISO(task.due_at)) && task.status !== "Completed";
  const taskLabels = (task.labels || []) as string[];

  return (
    <div
      style={style}
      className={cn(
        "flex items-center border-b border-border hover:bg-muted/50 transition-smooth",
        isSelected && "bg-primary/5"
      )}
    >
      {/* Checkbox */}
      <div className="w-[40px] flex-shrink-0 flex items-center justify-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(task.id, false)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(task.id, e.shiftKey);
          }}
        />
      </div>

      {/* Key */}
      <div className="w-[80px] flex-shrink-0 px-2">
        <button
          onClick={() => onTaskClick(task.id)}
          className="text-metadata text-primary hover:underline font-mono"
        >
          {getTaskKey(task.id)}
        </button>
      </div>

      {/* Summary */}
      <div className="flex-1 min-w-0 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span 
              className="text-metadata truncate block cursor-pointer hover:text-primary"
              onClick={() => onTaskClick(task.id)}
            >
              {task.title}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[400px]">
            {task.title}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Status */}
      <div className="w-[100px] flex-shrink-0 px-2">
        <Select value={task.status} onValueChange={(v) => onStatusChange(task.id, v)}>
          <SelectTrigger className="h-6 border-0 bg-transparent p-0 w-auto">
            <Badge className={cn("text-[10px] px-1.5 py-0", STATUS_COLORS[task.status])}>
              {task.status}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sprint */}
      <div className="w-[90px] flex-shrink-0 px-2">
        {task.sprint ? (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {task.sprint}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-metadata">—</span>
        )}
      </div>

      {/* Assignee */}
      <div className="w-[50px] flex-shrink-0 px-2">
        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex -space-x-1">
            {task.assignees.slice(0, 2).map((a) => (
              <Tooltip key={a.id}>
                <TooltipTrigger>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={a.avatar_url || undefined} />
                    <AvatarFallback className="text-[9px] bg-primary/10">
                      {a.name?.slice(0, 2).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{a.name}</TooltipContent>
              </Tooltip>
            ))}
            {task.assignees.length > 2 && (
              <span className="text-metadata text-muted-foreground ml-1">
                +{task.assignees.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-metadata">—</span>
        )}
      </div>

      {/* Priority */}
      <div className="w-[90px] flex-shrink-0 px-2">
        <Select value={task.priority || "Medium"} onValueChange={(v) => onPriorityChange(task.id, v)}>
          <SelectTrigger className="h-6 border-0 bg-transparent p-0 w-auto">
            <span className="text-metadata">
              {PRIORITY_ICONS[task.priority || "Medium"]} {task.priority || "Medium"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="High">🔴 High</SelectItem>
            <SelectItem value="Medium">🟠 Medium</SelectItem>
            <SelectItem value="Low">🟢 Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="w-[120px] flex-shrink-0 px-2">
        <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
          <PopoverTrigger asChild>
            <div className="flex gap-0.5 cursor-pointer min-h-[24px] items-center">
              {taskLabels.length > 0 ? (
                <>
                  {taskLabels.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn("text-[9px] px-1 py-0 h-4 border", getTagStyle(tag))}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {taskLabels.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{taskLabels.length - 2}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground text-metadata">—</span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-2" align="start">
            <TagsMultiSelect
              value={taskLabels}
              onChange={(tags) => {
                onTagsChange(task.id, tags);
                setTagsOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Due Date */}
      <div className="w-[90px] flex-shrink-0 px-2">
        {task.due_at ? (
          <span className={cn("text-metadata", isOverdue && "text-destructive font-medium")}>
            {formatDistanceToNow(parseISO(task.due_at), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-muted-foreground text-metadata">—</span>
        )}
      </div>

      {/* Created Date */}
      <div className="w-[80px] flex-shrink-0 px-2">
        <span className="text-metadata text-muted-foreground">
          {formatDistanceToNow(parseISO(task.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
});

// Header Component
function TableHeader({
  allSelected,
  onSelectAll,
  taskCount,
}: {
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  taskCount: number;
}) {
  return (
    <div className="flex items-center border-b-2 border-border bg-elevated sticky top-0 z-10 h-10">
      <div className="w-[40px] flex-shrink-0 flex items-center justify-center">
        <Checkbox
          checked={allSelected && taskCount > 0}
          onCheckedChange={onSelectAll}
        />
      </div>
      <div className="w-[80px] flex-shrink-0 px-2 text-metadata font-semibold text-muted-foreground">Key</div>
      <div className="flex-1 min-w-0 px-2 text-metadata font-semibold text-muted-foreground">Summary</div>
      <div className="w-[100px] flex-shrink-0 px-2 text-metadata font-semibold text-muted-foreground">Status</div>
      <div className="w-[90px] flex-shrink-0 px-2 text-metadata font-semibold text-muted-foreground">Sprint</div>
      <div className="w-[50px] flex-shrink-0 px-2 text-metadata font-semibold text-muted-foreground">Assignee</div>
      <div className="w-[90px] flex-shrink-0 px-2 text-metadata font-semibold text-muted-foreground">Priority</div>
      <div className="w-[120px] flex-shrink-0 px-2 text-metadata font-semibold text-muted-foreground">Tags</div>
      <div className="w-[90px] flex-shrink-0 px-2 text-metadata font-semibold text-muted-foreground">Due</div>
      <div className="w-[80px] flex-shrink-0 px-2 text-metadata font-semibold text-muted-foreground">Created</div>
    </div>
  );
}

export function AdvancedTaskTable({
  tasks,
  selectedIds,
  onSelectionChange,
  onTaskClick,
  onStatusChange,
  onPriorityChange,
  onTagsChange,
}: AdvancedTaskTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const lastSelectedIndex = useRef<number | null>(null);

  // Calculate container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Leave space for bulk actions bar
        setContainerHeight(window.innerHeight - rect.top - 100);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const handleSelect = useCallback((id: string, shiftKey: boolean) => {
    const newSelection = new Set(selectedIds);
    const currentIndex = tasks.findIndex(t => t.id === id);

    if (shiftKey && lastSelectedIndex.current !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex.current, currentIndex);
      const end = Math.max(lastSelectedIndex.current, currentIndex);
      for (let i = start; i <= end; i++) {
        newSelection.add(tasks[i].id);
      }
    } else {
      // Toggle selection
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      lastSelectedIndex.current = currentIndex;
    }

    onSelectionChange(newSelection);
  }, [selectedIds, tasks, onSelectionChange]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(tasks.map(t => t.id)));
    } else {
      onSelectionChange(new Set());
    }
  }, [tasks, onSelectionChange]);

  const allSelected = tasks.length > 0 && selectedIds.size === tasks.length;
  const shouldVirtualize = tasks.length > VIRTUALIZE_THRESHOLD;

  // Row renderer for virtualized list
  const VirtualRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const task = tasks[index];
    return (
      <TaskRow
        key={task.id}
        task={task}
        isSelected={selectedIds.has(task.id)}
        onSelect={handleSelect}
        onTaskClick={onTaskClick}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onTagsChange={onTagsChange}
        style={style}
      />
    );
  }, [tasks, selectedIds, handleSelect, onTaskClick, onStatusChange, onPriorityChange, onTagsChange]);

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden bg-background border border-border rounded-lg">
      <TableHeader
        allSelected={allSelected}
        onSelectAll={handleSelectAll}
        taskCount={tasks.length}
      />
      
      {shouldVirtualize ? (
        <List
          height={containerHeight}
          itemCount={tasks.length}
          itemSize={ROW_HEIGHT}
          width="100%"
          overscanCount={10}
        >
          {VirtualRow}
        </List>
      ) : (
        <div style={{ height: containerHeight, overflow: "auto" }}>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isSelected={selectedIds.has(task.id)}
              onSelect={handleSelect}
              onTaskClick={onTaskClick}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onTagsChange={onTagsChange}
            />
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          No tasks found
        </div>
      )}
    </div>
  );
}
