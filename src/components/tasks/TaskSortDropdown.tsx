import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type SortOption = "priority" | "due_time" | "status" | "alphabetical" | "manual";

interface TaskSortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export const TaskSortDropdown = ({ value, onChange }: TaskSortDropdownProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <ArrowUpDown className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="priority">Priority (High→Low)</SelectItem>
        <SelectItem value="due_time">Due Time (Early→Late)</SelectItem>
        <SelectItem value="status">Status</SelectItem>
        <SelectItem value="alphabetical">Alphabetical</SelectItem>
        <SelectItem value="manual">Manual Order</SelectItem>
      </SelectContent>
    </Select>
  );
};
