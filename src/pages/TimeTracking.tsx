import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function TimeTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [seconds, setSeconds] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    today: "0h 0m",
    week: "0h 0m",
    average: "0h 0m"
  });

  // Fetch tasks
  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchTimeEntries();
      fetchStats();
    }
  }, [user]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          const hours = Math.floor(newSeconds / 3600);
          const minutes = Math.floor((newSeconds % 3600) / 60);
          const secs = newSeconds % 60;
          setCurrentTime(
            `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
          );
          return newSeconds;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  // Real-time subscription for time entries
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('time-entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTimeEntries();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("id, title")
      .or(`assignee_id.eq.${user.id},created_by.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const fetchTimeEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("time_entries")
      .select(`
        *,
        tasks(title, status)
      `)
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(10);
    setTimeEntries(data || []);
  };

  const fetchStats = async () => {
    if (!user) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // Today's total
    const { data: todayData } = await supabase
      .from("time_entries")
      .select("seconds")
      .eq("user_id", user.id)
      .gte("started_at", today.toISOString());

    const todaySeconds = todayData?.reduce((acc, entry) => acc + (entry.seconds || 0), 0) || 0;

    // Week's total
    const { data: weekData } = await supabase
      .from("time_entries")
      .select("seconds")
      .eq("user_id", user.id)
      .gte("started_at", weekAgo.toISOString());

    const weekSeconds = weekData?.reduce((acc, entry) => acc + (entry.seconds || 0), 0) || 0;
    const avgSeconds = Math.floor(weekSeconds / 7);

    setStats({
      today: formatDuration(todaySeconds),
      week: formatDuration(weekSeconds),
      average: formatDuration(avgSeconds)
    });
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleStart = async () => {
    if (!selectedTaskId) {
      toast({
        title: "Error",
        description: "Please select a task first",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        task_id: selectedTaskId,
        user_id: user!.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
      return;
    }

    setCurrentEntryId(data.id);
    setIsTracking(true);
  };

  const handlePause = () => {
    setIsTracking(false);
  };

  const handleStop = async () => {
    if (!currentEntryId) return;

    const { error } = await supabase
      .from("time_entries")
      .update({
        ended_at: new Date().toISOString(),
        seconds: seconds,
      })
      .eq("id", currentEntryId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save time entry",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(false);
    setCurrentTime("00:00:00");
    setSeconds(0);
    setCurrentEntryId(null);
    setSelectedTaskId("");
    fetchTimeEntries();
    fetchStats();

    toast({
      title: "Time saved",
      description: "Your time entry has been recorded",
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Time Tracking</h1>
        <p className="text-muted-foreground">Track time spent on tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Today</p>
          <p className="text-3xl font-bold text-foreground">{stats.today}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">This Week</p>
          <p className="text-3xl font-bold text-foreground">{stats.week}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Average per Day</p>
          <p className="text-3xl font-bold text-foreground">{stats.average}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Current Timer</h2>
        <div className="space-y-4">
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={isTracking}>
            <SelectTrigger>
              <SelectValue placeholder="Select a task to track" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between p-8 bg-muted rounded-lg">
            <div className="text-5xl font-bold text-foreground font-mono">{currentTime}</div>
            <div className="flex gap-2">
              {!isTracking ? (
                <Button
                  size="lg"
                  onClick={handleStart}
                  className="gap-2"
                  disabled={!selectedTaskId}
                >
                  <Play className="h-5 w-5" />
                  Start
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handlePause}
                    className="gap-2"
                  >
                    <Pause className="h-5 w-5" />
                    Pause
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={handleStop}
                    className="gap-2"
                  >
                    <Square className="h-5 w-5" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Time Entries</h2>
        <div className="space-y-3">
          {timeEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No time entries yet. Start tracking to see your history!</p>
          ) : (
            timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-all"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">{entry.tasks?.title || "Unknown Task"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(entry.started_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-foreground">
                    {formatDuration(entry.seconds || 0)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      entry.tasks?.status === "Completed"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {entry.ended_at ? "Completed" : "In Progress"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
