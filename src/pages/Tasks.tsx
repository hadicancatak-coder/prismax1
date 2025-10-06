import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const tasks = {
    today: [
      {
        id: 1,
        title: "Update website homepage",
        description: "Redesign the hero section with new branding",
        assignee: "Sarah Chen",
        status: "In Progress",
        priority: "High",
        dueDate: "2024-12-26",
        timeTracked: "2h 30m",
      },
      {
        id: 2,
        title: "Review Q4 budget proposal",
        description: "Check all numbers and provide feedback",
        assignee: "Mike Johnson",
        status: "Pending Approval",
        priority: "High",
        dueDate: "2024-12-26",
        timeTracked: "1h 15m",
      },
    ],
    weekly: [
      {
        id: 3,
        title: "Design new feature mockups",
        description: "Create wireframes for the new dashboard",
        assignee: "Emma Davis",
        status: "In Progress",
        priority: "Medium",
        dueDate: "2024-12-28",
        timeTracked: "4h 00m",
      },
      {
        id: 4,
        title: "Update documentation",
        description: "Add API documentation for new endpoints",
        assignee: "Alex Kim",
        status: "To Do",
        priority: "Low",
        dueDate: "2024-12-30",
        timeTracked: "0h 00m",
      },
    ],
    monthly: [
      {
        id: 5,
        title: "Plan Q1 roadmap",
        description: "Schedule meetings with stakeholders",
        assignee: "Sarah Chen",
        status: "To Do",
        priority: "Medium",
        dueDate: "2025-01-15",
        timeTracked: "0h 00m",
      },
    ],
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tasks</h1>
          <p className="text-muted-foreground">Manage and track your team's tasks</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6 space-y-4">
          {tasks.today.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-4">
          {tasks.weekly.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 space-y-4">
          {tasks.monthly.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>
      </Tabs>

      <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
