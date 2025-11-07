import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { 
  startOfToday, 
  endOfToday, 
  startOfTomorrow, 
  endOfTomorrow,
  startOfWeek,
  endOfWeek,
  addWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  startOfYesterday,
  endOfYesterday
} from "date-fns";
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
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleFilterClick = (filterType: string) => {
    setSelectedFilter(filterType);
    
    const now = new Date();
    let filter: DateFilter | null = null;

    switch (filterType) {
      case "today":
        filter = { label: "Today", startDate: startOfToday(), endDate: endOfToday() };
        break;
      case "yesterday":
        filter = { label: "Yesterday", startDate: startOfYesterday(), endDate: endOfYesterday() };
        break;
      case "tomorrow":
        filter = { label: "Tomorrow", startDate: startOfTomorrow(), endDate: endOfTomorrow() };
        break;
      case "thisWeek":
        filter = { label: "This Week", startDate: startOfWeek(now), endDate: endOfWeek(now) };
        break;
      case "nextWeek":
        const nextWeek = addWeeks(now, 1);
        filter = { label: "Next Week", startDate: startOfWeek(nextWeek), endDate: endOfWeek(nextWeek) };
        break;
      case "thisMonth":
        filter = { label: "This Month", startDate: startOfMonth(now), endDate: endOfMonth(now) };
        break;
      case "nextMonth":
        const nextMonth = addMonths(now, 1);
        filter = { label: "Next Month", startDate: startOfMonth(nextMonth), endDate: endOfMonth(nextMonth) };
        break;
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
          <Calendar
            mode="range"
            selected={customRange ? { from: customRange.from, to: customRange.to } : undefined}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                const newRange = { from: range.from, to: range.to };
                setCustomRange(newRange);
                setSelectedFilter("custom");
                onFilterChange({ 
                  label: `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}`, 
                  startDate: range.from, 
                  endDate: range.to 
                });
                setCalendarOpen(false);
              }
            }}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
