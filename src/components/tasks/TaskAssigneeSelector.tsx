import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface User {
  id: string;
  user_id: string;
  name: string;
  username?: string;
  working_days?: number[];
}

interface TaskAssigneeSelectorProps {
  mode: 'create' | 'edit';
  taskId?: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  users: User[];
  disabled?: boolean;
}

export function TaskAssigneeSelector({
  mode,
  taskId,
  selectedIds,
  onSelectionChange,
  users,
  disabled = false,
}: TaskAssigneeSelectorProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const selectedUsers = users.filter(u => selectedIds.includes(u.id));

  const toggleUser = async (userId: string) => {
    if (disabled) return;

    const isSelected = selectedIds.includes(userId);

    if (mode === 'edit' && taskId) {
      // Direct DB operation for edit mode
      try {
        if (isSelected) {
          // Remove assignee
          await supabase
            .from("task_assignees")
            .delete()
            .eq("task_id", taskId)
            .eq("user_id", userId);
        } else {
          // Add assignee
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user?.id)
            .single();

          if (profile) {
            await supabase.from("task_assignees").insert({
              task_id: taskId,
              user_id: userId,
              assigned_by: profile.id,
            });
          }
        }
      } catch (error) {
        console.error("Error updating assignee:", error);
      }
    }

    // Update local state for both modes
    const newSelection = isSelected
      ? selectedIds.filter(id => id !== userId)
      : [...selectedIds, userId];
    onSelectionChange(newSelection);
  };

  const removeUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleUser(userId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between h-auto min-h-[44px] py-2 transition-smooth"
        >
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedUsers.length === 0 ? (
              <span className="text-muted-foreground">Select assignees...</span>
            ) : (
              selectedUsers.map(user => (
                <Badge 
                  key={user.id} 
                  variant="secondary" 
                  className="gap-1 pr-1"
                >
                  {user.name}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeUser(user.id, e)}
                      className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-smooth"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[400px] p-0 bg-popover border-border z-[100]" 
        align="start" 
        side="bottom" 
        sideOffset={5}
      >
        <Command>
          <CommandInput placeholder="Search users..." className="border-none" />
          <CommandEmpty>No users found.</CommandEmpty>
          <CommandList className="max-h-[300px] hide-scrollbar">
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.name}
                  onSelect={() => toggleUser(user.id)}
                  className="cursor-pointer transition-smooth"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 transition-opacity",
                      selectedIds.includes(user.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    {user.username && (
                      <span className="text-metadata text-muted-foreground">@{user.username}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
