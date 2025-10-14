import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserPlus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  user_id: string;
  name: string;
  username?: string;
}

interface MultiAssigneeSelectorProps {
  entityType: "task" | "project" | "campaign" | "blocker";
  entityId: string;
  assignees: User[];
  onAssigneesChange: () => void;
  disabled?: boolean;
}

export function MultiAssigneeSelector({
  entityType,
  entityId,
  assignees,
  onAssigneesChange,
  disabled = false,
}: MultiAssigneeSelectorProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("public_profiles")
      .select("user_id, name, username");
    setUsers(data || []);
  };

  const handleAssign = async (userId: string) => {
    const currentUser = (await supabase.auth.getUser()).data.user?.id;
    let error: any = null;

    if (entityType === "task") {
      const { error: err } = await supabase.from("task_assignees").insert({
        task_id: entityId,
        user_id: userId,
        assigned_by: currentUser,
      });
      error = err;
    } else if (entityType === "project") {
      const { error: err } = await supabase.from("project_assignees").insert({
        project_id: entityId,
        user_id: userId,
        assigned_by: currentUser,
      });
      error = err;
    } else if (entityType === "campaign") {
      const { error: err } = await supabase.from("campaign_assignees").insert({
        campaign_id: entityId,
        user_id: userId,
        assigned_by: currentUser,
      });
      error = err;
    } else if (entityType === "blocker") {
      const { error: err } = await supabase.from("blocker_assignees").insert({
        blocker_id: entityId,
        user_id: userId,
        assigned_by: currentUser,
      });
      error = err;
    }

    if (error) {
      toast({
        title: "Error",
        description: "Failed to assign user",
        variant: "destructive",
      });
    } else {
      onAssigneesChange();
    }
  };

  const handleUnassign = async (userId: string) => {
    let error: any = null;

    if (entityType === "task") {
      const { error: err } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", entityId)
        .eq("user_id", userId);
      error = err;
    } else if (entityType === "project") {
      const { error: err } = await supabase
        .from("project_assignees")
        .delete()
        .eq("project_id", entityId)
        .eq("user_id", userId);
      error = err;
    } else if (entityType === "campaign") {
      const { error: err } = await supabase
        .from("campaign_assignees")
        .delete()
        .eq("campaign_id", entityId)
        .eq("user_id", userId);
      error = err;
    } else if (entityType === "blocker") {
      const { error: err } = await supabase
        .from("blocker_assignees")
        .delete()
        .eq("blocker_id", entityId)
        .eq("user_id", userId);
      error = err;
    }

    if (error) {
      toast({
        title: "Error",
        description: "Failed to unassign user",
        variant: "destructive",
      });
    } else {
      onAssigneesChange();
    }
  };

  const availableUsers = users.filter(
    (u) => !assignees.find((a) => a.user_id === u.user_id)
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assignees.map((assignee) => (
        <Badge
          key={assignee.user_id}
          variant="secondary"
          className="gap-1 pr-1 pl-2 py-1"
        >
          <Avatar className="h-4 w-4">
            <AvatarFallback className="text-[8px]">
              {getInitials(assignee.name)}
            </AvatarFallback>
          </Avatar>
          <span 
            className="text-xs cursor-pointer hover:underline" 
            onClick={() => navigate(`/profile/${assignee.user_id}`)}
          >
            {assignee.username || assignee.name}
          </span>
          {!disabled && (
            <button
              onClick={() => handleUnassign(assignee.user_id)}
              className="hover:bg-background/50 rounded-full p-0.5 ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}

      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 gap-1 text-xs"
            >
              <UserPlus className="h-3 w-3" />
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 bg-background" align="start">
            <ScrollArea className="max-h-64">
              <div className="space-y-1 pr-3">
                {availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => {
                        handleAssign(user.user_id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-3 text-center">
                    All users assigned
                  </div>
                )}
              </div>
            </ScrollArea>
            {availableUsers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            )}
          </PopoverContent>
        </Popover>
      )}

      {assignees.length === 0 && disabled && (
        <span className="text-xs text-muted-foreground">No assignees</span>
      )}
    </div>
  );
}