import { Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";

const statuses = [
  { value: "Backlog", label: "Backlog" },
  { value: "Pending", label: "Pending" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Blocked", label: "Blocked" },
  { value: "Completed", label: "Completed" },
  { value: "Failed", label: "Failed" },
];

interface StatusMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function StatusMultiSelect({ value, onChange }: StatusMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (status: string) => {
    if (value.includes(status)) {
      onChange(value.filter(s => s !== status));
    } else {
      onChange([...value, status]);
    }
  };

  const handleSelectAll = () => {
    onChange(statuses.map(s => s.value));
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const hasActiveFilter = value.length > 0 && value.length < statuses.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasActiveFilter ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5 px-3 flex-shrink-0"
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="text-sm">
            {value.length === 0 ? "None" : 
             value.length === statuses.length ? "Status" : 
             `${value.length} Status`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-2 bg-popover border-border z-[100]" align="start">
        <div className="space-y-1">
          <div className="flex gap-1 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1 h-7 text-metadata"
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              className="flex-1 h-7 text-metadata"
            >
              None
            </Button>
          </div>
          <div className="h-px bg-border" />
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => handleToggle(status.value)}
              className={cn(
                "flex items-center w-full px-2 py-1.5 rounded text-body-sm transition-smooth cursor-pointer",
                value.includes(status.value) 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-4 w-4 rounded border mr-2 transition-smooth",
                value.includes(status.value) 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-input"
              )}>
                {value.includes(status.value) && <Check className="h-3 w-3" />}
              </div>
              {status.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
