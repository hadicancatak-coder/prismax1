import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

const statuses = [
  { value: "To Do", label: "To Do" },
  { value: "In Progress", label: "In Progress" },
  { value: "Blocked", label: "Blocked" },
  { value: "Completed", label: "Completed" },
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[100px] h-8 text-sm flex-shrink-0 justify-between"
        >
          <span className="truncate">
            {value.length === 0
              ? "Select status..."
              : value.length === statuses.length
              ? "All statuses"
              : `${value.length} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search status..." />
          <CommandEmpty>No status found.</CommandEmpty>
          <CommandGroup>
            <CommandItem onSelect={handleSelectAll} className="cursor-pointer">
              <Check className={cn("mr-2 h-4 w-4", value.length === statuses.length ? "opacity-100" : "opacity-0")} />
              Select All
            </CommandItem>
            <CommandItem onSelect={handleDeselectAll} className="cursor-pointer">
              <Check className={cn("mr-2 h-4 w-4", value.length === 0 ? "opacity-100" : "opacity-0")} />
              Deselect All
            </CommandItem>
            <div className="h-px bg-border my-1" />
            {statuses.map((status) => (
              <CommandItem
                key={status.value}
                value={status.value}
                onSelect={() => handleToggle(status.value)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(status.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {status.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
