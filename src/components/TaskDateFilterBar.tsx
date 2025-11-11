import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { dateRangePresets } from "@/lib/dateRangePresets";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";

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
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleFilterClick = (filterType: string) => {
    setSelectedFilter(filterType);
    setCustomRange(null);
    
    let filter: DateFilter | null = null;

    switch (filterType) {
      case "today": {
        const preset = dateRangePresets.today();
        filter = { label: preset.label, startDate: preset.from, endDate: preset.to };
        break;
      }
      case "yesterday": {
        const preset = dateRangePresets.yesterday();
        filter = { label: preset.label, startDate: preset.from, endDate: preset.to };
        break;
      }
      case "tomorrow": {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filter = { label: "Tomorrow", startDate: tomorrow, endDate: tomorrow };
        break;
      }
      case "thisWeek": {
        const preset = dateRangePresets.thisWeek();
        filter = { label: preset.label, startDate: preset.from, endDate: preset.to };
        break;
      }
      case "nextWeek": {
        const preset = dateRangePresets.nextWeek();
        filter = { label: preset.label, startDate: preset.from, endDate: preset.to };
        break;
      }
      case "thisMonth": {
        const preset = dateRangePresets.thisMonth();
        filter = { label: preset.label, startDate: preset.from, endDate: preset.to };
        break;
      }
      case "nextMonth": {
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const startDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
        const endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
        filter = { label: "Next Month", startDate, endDate };
        break;
      }
      case "backlog":
        filter = { label: "Backlog", startDate: new Date(0), endDate: new Date(0) };
        break;
      case "custom":
        if (customRange?.from && customRange?.to) {
          filter = { 
            label: `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d')}`, 
            startDate: customRange.from, 
            endDate: customRange.to 
          };
        }
        break;
      case "all":
      default:
        filter = null;
    }

    onFilterChange(filter);
  };

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
      <Select value={selectedFilter} onValueChange={handleFilterClick}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Dates</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="tomorrow">Tomorrow</SelectItem>
          <SelectItem value="thisWeek">This Week</SelectItem>
          <SelectItem value="nextWeek">Next Week</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="nextMonth">Next Month</SelectItem>
          <SelectItem value="backlog">Backlog</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant={selectedFilter === "custom" ? "default" : "outline"} 
            size="sm"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[200]" align="start">
          <DateRangePicker
            value={customRange}
            onChange={(range) => {
              setCustomRange(range);
              if (range) {
                setSelectedFilter("custom");
                onFilterChange({
                  label: `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}`,
                  startDate: range.from,
                  endDate: range.to
                });
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
