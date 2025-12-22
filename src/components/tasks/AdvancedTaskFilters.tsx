import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusMultiSelect } from "./StatusMultiSelect";
import { TagsMultiSelect } from "./TagsMultiSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AdvancedTaskFiltersState {
  search: string;
  statuses: string[];
  sprint: string;
  tags: string[];
  assignees: string[];
  priority: string;
}

interface AdvancedTaskFiltersProps {
  filters: AdvancedTaskFiltersState;
  onChange: (filters: AdvancedTaskFiltersState) => void;
  sprints: string[];
}

export function AdvancedTaskFilters({ filters, onChange, sprints }: AdvancedTaskFiltersProps) {
  const updateFilter = <K extends keyof AdvancedTaskFiltersState>(
    key: K,
    value: AdvancedTaskFiltersState[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onChange({
      search: "",
      statuses: [],
      sprint: "",
      tags: [],
      assignees: [],
      priority: "",
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.statuses.length > 0 || 
    filters.sprint || 
    filters.tags.length > 0 || 
    filters.assignees.length > 0 || 
    filters.priority;

  return (
    <div className="flex items-center gap-2 flex-wrap py-3 px-1 border-b border-border bg-background">
      {/* Search */}
      <div className="relative w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-8 h-8 text-metadata"
        />
      </div>

      {/* Status */}
      <StatusMultiSelect
        value={filters.statuses}
        onChange={(v) => updateFilter("statuses", v)}
      />

      {/* Sprint */}
      <Select
        value={filters.sprint || "all"}
        onValueChange={(v) => updateFilter("sprint", v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-[100px] h-8 text-metadata">
          <SelectValue placeholder="Sprint" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sprints</SelectItem>
          {sprints.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tags */}
      <div className="w-[160px]">
        <div className="[&>div]:min-h-[32px] [&>div]:py-1">
          <TagsMultiSelect
            value={filters.tags}
            onChange={(v) => updateFilter("tags", v)}
          />
        </div>
      </div>

      {/* Assignee - simplified for now */}
      <Select
        value={filters.assignees[0] || "all"}
        onValueChange={(v) => updateFilter("assignees", v === "all" ? [] : [v])}
      >
        <SelectTrigger className="w-[100px] h-8 text-metadata">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select
        value={filters.priority || "all"}
        onValueChange={(v) => updateFilter("priority", v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-[100px] h-8 text-metadata">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="High">🔴 High</SelectItem>
          <SelectItem value="Medium">🟠 Medium</SelectItem>
          <SelectItem value="Low">🟢 Low</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
