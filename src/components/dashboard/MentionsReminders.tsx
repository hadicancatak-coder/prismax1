import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface MentionReminderItem {
  id: string;
  type: 'mention' | 'reminder';
  icon: string;
  text: string;
  timestamp: string;
  taskId?: string;
  notificationId?: string;
}

interface MentionsRemindersProps {
  userId: string;
}

export function MentionsReminders({ userId }: MentionsRemindersProps) {
  const [items, setItems] = useState<MentionReminderItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    fetchItems();

    const channel = supabase
      .channel('mentions_reminders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchItems = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!profile) return;

    // Fetch unread notifications (reminders)
    const { data: notifications } = await supabase
      .from("notifications")
      .select("id, type, payload_json, created_at")
      .eq("user_id", profile.id)
      .is("read_at", null)
      .in("type", ["deadline_reminder_3days", "deadline_reminder_1day", "deadline_reminder_overdue"])
      .order("created_at", { ascending: false })
      .limit(5);

    const reminderItems: MentionReminderItem[] = (notifications || []).map(n => {
      const payload = n.payload_json as any;
      return {
        id: n.id,
        type: 'reminder' as const,
        icon: '🔔',
        text: payload?.message || `Reminder: ${n.type}`,
        timestamp: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
        taskId: payload?.task_id,
        notificationId: n.id,
      };
    });

    setItems(reminderItems);
  };

  const handleView = (item: MentionReminderItem) => {
    if (item.taskId) {
      navigate(`/tasks?taskId=${item.taskId}`);
    }
  };

  const handleDismiss = async (item: MentionReminderItem) => {
    if (item.notificationId) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", item.notificationId);
      
      fetchItems();
    }
  };

  return (
    <div className="space-y-0">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Mentions & Reminders</h2>
      
      {items.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No mentions or reminders
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {items.map(item => (
            <div key={item.id} className="py-3 hover:bg-gray-50 transition-colors group">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{item.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.timestamp}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-9 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleView(item)}
                  className="h-7 text-xs"
                >
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleDismiss(item)}
                  className="h-7 text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
