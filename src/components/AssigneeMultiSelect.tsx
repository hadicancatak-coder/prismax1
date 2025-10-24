import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface User {
  user_id: string;
  name: string;
  username: string;
}

interface AssigneeMultiSelectProps {
  users: User[];
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  placeholder?: string;
}

export function AssigneeMultiSelect({ 
  users, 
  selectedUserIds, 
  onSelectionChange,
  placeholder = "Select assignees..."
}: AssigneeMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleUser = (userId: string) => {
    const newSelection = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    onSelectionChange(newSelection);
  };

  const selectedUsers = users.filter(u => selectedUserIds.includes(u.user_id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[44px] py-2"
          >
            <div className="flex flex-wrap gap-1.5">
              {selectedUsers.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selectedUsers.map(user => (
                  <Badge key={user.user_id} variant="secondary" className="gap-1">
                    {user.name}
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.user_id}
                    value={user.name}
                    onSelect={() => toggleUser(user.user_id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUserIds.includes(user.user_id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
