import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";
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
  addMonths
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
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground font-medium">Date:</span>
      
      <Button
        variant={selectedFilter === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterClick("all")}
      >
        All
        {taskCounts && <Badge variant="secondary" className="ml-1.5">{taskCounts.all}</Badge>}
      </Button>

      <Button
        variant={selectedFilter === "today" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterClick("today")}
      >
        Today
        {taskCounts && <Badge variant="secondary" className="ml-1.5">{taskCounts.today}</Badge>}
      </Button>

      <Button
        variant={selectedFilter === "tomorrow" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterClick("tomorrow")}
      >
        Tomorrow
        {taskCounts && <Badge variant="secondary" className="ml-1.5">{taskCounts.tomorrow}</Badge>}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            More <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-background">
          <DropdownMenuItem onClick={() => handleFilterClick("thisWeek")}>
            This Week {taskCounts && `(${taskCounts.thisWeek})`}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterClick("nextWeek")}>
            Next Week {taskCounts && `(${taskCounts.nextWeek})`}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterClick("thisMonth")}>
            This Month {taskCounts && `(${taskCounts.thisMonth})`}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterClick("nextMonth")}>
            Next Month {taskCounts && `(${taskCounts.nextMonth})`}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterClick("backlog")}>
            Backlog {taskCounts && `(${taskCounts.backlog})`}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant={selectedFilter === "custom" ? "default" : "outline"} 
            size="sm"
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            {customRange?.from && customRange?.to 
              ? `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d')}` 
              : 'Custom'}
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

      <div className="h-6 w-px bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {statusOptions.find(s => s.value === selectedStatus)?.label || "Status"}
            <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-background">
          {statusOptions.map((status) => (
            <DropdownMenuItem 
              key={status.value}
              onClick={() => onStatusChange(status.value)}
            >
              {status.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
