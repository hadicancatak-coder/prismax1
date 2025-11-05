import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { TaskDialog } from "@/components/TaskDialog";
import { NewsTicker } from "@/components/NewsTicker";
import { MyDaySection } from "@/components/dashboard/MyDaySection";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { MentionsReminders } from "@/components/dashboard/MentionsReminders";
import { MyDaySkeleton } from "@/components/skeletons/MyDaySkeleton";
import { ActivitySkeleton } from "@/components/skeletons/ActivitySkeleton";
import { MentionsSkeleton } from "@/components/skeletons/MentionsSkeleton";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard</h1>
        </header>

        <NewsTicker />

        {loading || !user ? (
          <MyDaySkeleton />
        ) : (
          <MyDaySection userId={user.id} onTaskClick={handleTaskClick} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {loading || !user ? (
            <>
              <ActivitySkeleton />
              <MentionsSkeleton />
            </>
          ) : (
            <>
              <ActivityFeed />
              <MentionsReminders userId={user.id} />
            </>
          )}
        </div>

        {selectedTaskId && (
          <TaskDialog 
            open={taskDialogOpen} 
            onOpenChange={setTaskDialogOpen} 
            taskId={selectedTaskId} 
          />
        )}
      </div>
    </div>
  );
}

