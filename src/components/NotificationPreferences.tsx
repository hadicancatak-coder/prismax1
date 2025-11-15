import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const NOTIFICATION_TYPES = [
  { id: "task_assigned", label: "Task assignments", description: "When you're assigned to a task" },
  { id: "mention", label: "Mentions", description: "When someone mentions you" },
  { id: "deadline_reminder_3days", label: "3-day deadline reminders", description: "Task due in 3 days" },
  { id: "deadline_reminder_1day", label: "1-day deadline reminders", description: "Task due tomorrow" },
  { id: "deadline_reminder_overdue", label: "Overdue reminders", description: "When tasks are overdue" },
  { id: "task_status_changed", label: "Task status changes", description: "When task status updates" },
  { id: "campaign_starting_soon", label: "Campaign reminders", description: "Campaign launching soon" },
  { id: "campaign_status_changed", label: "Campaign status changes", description: "Launch Pad updates" },
  { id: "blocker_resolved", label: "Blocker resolved", description: "When blockers are cleared" },
  { id: "approval_pending", label: "Approval reminders", description: "Pending approval notifications" },
  { id: "announcement", label: "Announcements", description: "System-wide announcements" },
];

export function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    const { data } = await supabase
      .from("notification_preferences")
      .select("notification_type, enabled")
      .eq("user_id", user?.id);

    const prefs: Record<string, boolean> = {};
    NOTIFICATION_TYPES.forEach((type) => {
      const pref = data?.find((p) => p.notification_type === type.id);
      prefs[type.id] = pref ? pref.enabled : true;
    });

    setPreferences(prefs);
    setLoading(false);
  };

  const togglePreference = async (notificationType: string) => {
    const newValue = !preferences[notificationType];
    
    setPreferences({ ...preferences, [notificationType]: newValue });

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: user?.id,
          notification_type: notificationType,
          enabled: newValue,
        },
        { onConflict: "user_id,notification_type" }
      );

    if (error) {
      setPreferences({ ...preferences, [notificationType]: !newValue });
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: `Notification preference ${newValue ? "enabled" : "disabled"}`,
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Notification Preferences</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Control which notifications you want to receive
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="mt-6">
          <div className="space-y-4">
            {NOTIFICATION_TYPES.map((type) => (
              <div key={type.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor={type.id} className="font-medium cursor-pointer">
                    {type.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                <Switch
                  id={type.id}
                  checked={preferences[type.id]}
                  onCheckedChange={() => togglePreference(type.id)}
                />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
