import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DateFilter {
  label: string;
  startDate: Date;
  endDate: Date;
}

interface TaskDateFilterBarProps {
  onFilterChange: (filter: DateFilter | null) => void;
  onStatusChange: (status: string) => void;
  selectedStatus: string;
  taskCounts?: {
    all: number;
    today: number;
    tomorrow: number;
    thisWeek: number;
    nextWeek: number;
    thisMonth: number;
    nextMonth: number;
    backlog: number;
  };
}

export function TaskDateFilterBar({ 
  onFilterChange, 
  onStatusChange,
  selectedStatus,
  taskCounts 
}: TaskDateFilterBarProps) {
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "Pending", label: "Pending" },
    { value: "Ongoing", label: "Ongoing" },
    { value: "Completed", label: "Completed" },
    { value: "Failed", label: "Failed" },
    { value: "Blocked", label: "Blocked" },
  ];

  return (
    <div className="flex items-center gap-2">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant={customRange ? "default" : "outline"} 
            size="sm"
            className="min-w-[140px]"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {customRange 
              ? `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d')}`
              : "Select Date Range"
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[200]" align="start">
          <DateRangePicker
            value={customRange}
            onChange={(range) => {
              setCustomRange(range);
              if (range) {
                onFilterChange({
                  label: `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}`,
                  startDate: range.from,
                  endDate: range.to
                });
              } else {
                onFilterChange(null);
              }
            }}
            onApply={() => setCalendarOpen(false)}
            presets="full"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
