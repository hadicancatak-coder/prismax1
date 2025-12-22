import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { TagsMultiSelect } from "./TagsMultiSelect";
import { 
  X, 
  CheckCircle2, 
  Trash2, 
  Flag, 
  Tag, 
  Users, 
  CalendarIcon,
  Archive
} from "lucide-react";
import { TASK_STATUS_OPTIONS } from "@/domain";
import { format } from "date-fns";

interface AdvancedBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onAddTags: (tags: string[]) => void;
  onRemoveTags: (tags: string[]) => void;
  onSetAssignees: (userIds: string[]) => void;
  onSetDueDate: (date: string | null) => void;
  onSetSprint: (sprint: string | null) => void;
  onDelete: () => void;
  onArchive: () => void;
  sprints: string[];
  currentTags: string[]; // Tags currently on selected tasks (for remove)
}

export function AdvancedBulkActionsBar({
  selectedCount,
  onClearSelection,
  onStatusChange,
  onPriorityChange,
  onAddTags,
  onRemoveTags,
  onSetAssignees,
  onSetDueDate,
  onSetSprint,
  onDelete,
  onArchive,
  sprints,
  currentTags,
}: AdvancedBulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [addTagsOpen, setAddTagsOpen] = useState(false);
  const [removeTagsOpen, setRemoveTagsOpen] = useState(false);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tempAssignees, setTempAssignees] = useState<string[]>([]);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);

  if (selectedCount === 0) return null;

  const handleAddTags = () => {
    if (tempTags.length > 0) {
      onAddTags(tempTags);
      setTempTags([]);
      setAddTagsOpen(false);
    }
  };

  const handleRemoveTags = () => {
    if (tempTags.length > 0) {
      onRemoveTags(tempTags);
      setTempTags([]);
      setRemoveTagsOpen(false);
    }
  };

  const handleSetAssignees = () => {
    onSetAssignees(tempAssignees);
    setTempAssignees([]);
    setAssigneesOpen(false);
  };

  const handleSetDate = () => {
    onSetDueDate(tempDate ? tempDate.toISOString() : null);
    setTempDate(undefined);
    setDateOpen(false);
  };

  return (
    <>
      <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 z-overlay shadow-xl border-2">
        <div className="flex items-center gap-3 p-3 flex-wrap">
          {/* Selection count */}
          <div className="flex items-center gap-2 text-metadata">
            <span className="font-semibold text-body-sm">{selectedCount}</span>
            <span className="text-muted-foreground">selected</span>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Clear */}
          <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-7 px-2">
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>

          <div className="h-5 w-px bg-border" />

          {/* Status */}
          <Select onValueChange={onStatusChange}>
            <SelectTrigger className="h-7 w-[120px] text-metadata">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority */}
          <Select onValueChange={onPriorityChange}>
            <SelectTrigger className="h-7 w-[100px] text-metadata">
              <Flag className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">🔴 High</SelectItem>
              <SelectItem value="Medium">🟠 Medium</SelectItem>
              <SelectItem value="Low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Add Tags */}
          <Popover open={addTagsOpen} onOpenChange={setAddTagsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-metadata">
                <Tag className="h-3.5 w-3.5 mr-1" />
                Add Tags
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-3" align="start">
              <div className="space-y-3">
                <TagsMultiSelect value={tempTags} onChange={setTempTags} />
                <Button size="sm" onClick={handleAddTags} disabled={tempTags.length === 0} className="w-full h-7">
                  Add to {selectedCount} tasks
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Remove Tags */}
          <Popover open={removeTagsOpen} onOpenChange={setRemoveTagsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-metadata">
                <Tag className="h-3.5 w-3.5 mr-1" />
                Remove Tags
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-3" align="start">
              <div className="space-y-3">
                <p className="text-metadata text-muted-foreground">
                  Tags on selected: {currentTags.length > 0 ? currentTags.join(", ") : "None"}
                </p>
                <TagsMultiSelect value={tempTags} onChange={setTempTags} />
                <Button size="sm" onClick={handleRemoveTags} disabled={tempTags.length === 0} className="w-full h-7">
                  Remove from {selectedCount} tasks
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Assignees - simplified */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSetAssignees([])} 
            className="h-7 text-metadata"
          >
            <Users className="h-3.5 w-3.5 mr-1" />
            Clear Assignees
          </Button>

          {/* Sprint */}
          <Select onValueChange={(v) => onSetSprint(v === "none" ? null : v)}>
            <SelectTrigger className="h-7 w-[100px] text-metadata">
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Sprint</SelectItem>
              {sprints.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Due Date */}
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-metadata">
                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                Due Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={tempDate}
                onSelect={setTempDate}
                initialFocus
              />
              <div className="flex gap-2 p-3 border-t border-border">
                <Button size="sm" variant="outline" onClick={() => { onSetDueDate(null); setDateOpen(false); }} className="flex-1 h-7">
                  Clear
                </Button>
                <Button size="sm" onClick={handleSetDate} disabled={!tempDate} className="flex-1 h-7">
                  Set
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="h-5 w-px bg-border" />

          {/* Archive */}
          <Button variant="outline" size="sm" onClick={onArchive} className="h-7 text-metadata">
            <Archive className="h-3.5 w-3.5 mr-1" />
            Archive
          </Button>

          {/* Delete */}
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="h-7">
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(); setShowDeleteDialog(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
