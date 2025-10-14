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
import { ChevronDown, Calendar } from "lucide-react";
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

export interface DateFilter {
  label: string;
  startDate: Date;
  endDate: Date;
}

interface TaskDateFilterBarProps {
  onFilterChange: (filter: DateFilter | null) => void;
  onStatusChange: (status: string) => void;
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
  taskCounts 
}: TaskDateFilterBarProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

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
      case "all":
      default:
        filter = null;
    }

    onFilterChange(filter);
  };

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status);
    onStatusChange(status);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        
        <Button
          variant={selectedFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterClick("all")}
        >
          All Tasks
          {taskCounts && <Badge variant="secondary" className="ml-2">{taskCounts.all}</Badge>}
        </Button>

        <Button
          variant={selectedFilter === "today" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterClick("today")}
        >
          Today
          {taskCounts && <Badge variant="secondary" className="ml-2">{taskCounts.today}</Badge>}
        </Button>

        <Button
          variant={selectedFilter === "tomorrow" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterClick("tomorrow")}
        >
          Tomorrow
          {taskCounts && <Badge variant="secondary" className="ml-2">{taskCounts.tomorrow}</Badge>}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              More <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
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
              📋 Backlog {taskCounts && `(${taskCounts.backlog})`}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 pl-8 border-l-2">
        <Label className="text-sm text-muted-foreground">Status:</Label>
        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusClick("all")}
        >
          All
        </Button>
        <Button
          variant={selectedStatus === "Pending" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusClick("Pending")}
        >
          Pending
        </Button>
        <Button
          variant={selectedStatus === "Ongoing" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusClick("Ongoing")}
        >
          Ongoing
        </Button>
        <Button
          variant={selectedStatus === "Completed" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusClick("Completed")}
        >
          Completed
        </Button>
        <Button
          variant={selectedStatus === "Failed" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusClick("Failed")}
        >
          Failed
        </Button>
        <Button
          variant={selectedStatus === "Blocked" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusClick("Blocked")}
        >
          Blocked
        </Button>
      </div>
    </div>
  );
}
