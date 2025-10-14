import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface User {
  user_id: string;
  name: string;
  username?: string;
}

interface MentionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  as?: 'input' | 'textarea';
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onBlur?: () => void;
}

export function MentionAutocomplete({
  value,
  onChange,
  users,
  as = 'input',
  placeholder,
  className,
  onKeyDown: externalOnKeyDown,
  onBlur,
}: MentionAutocompleteProps) {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [filteredUsers, setFilteredUsers] = React.useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const inputRef = React.useRef<any>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Detect @ and filter users
  React.useEffect(() => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const match = textBeforeCursor.match(/@(\w*)$/);
    
    if (match) {
      const query = match[1].toLowerCase();
      const filtered = users.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.username?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
      setShowDropdown(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
    }
  }, [value, cursorPosition, users]);

  // Track cursor position
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleClick = () => {
    setCursorPosition(inputRef.current?.selectionStart || 0);
  };

  // Insert selected user
  const insertMention = (user: User) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    const username = user.username || user.name.toLowerCase().replace(/\s+/g, '');
    const newValue = 
      textBeforeCursor.substring(0, lastAtIndex) + 
      `@${username} ` + 
      textAfterCursor;
    
    onChange(newValue);
    setShowDropdown(false);
    
    // Set focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = lastAtIndex + username.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (showDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredUsers.length > 0) {
        e.preventDefault();
        insertMention(filteredUsers[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }
    
    externalOnKeyDown?.(e);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const commonProps = {
    ref: inputRef,
    value,
    onChange: handleChange,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    onBlur,
    placeholder,
    className,
  };

  return (
    <div className="relative">
      {as === 'input' ? (
        <Input {...commonProps} />
      ) : (
        <Textarea {...commonProps} />
      )}
      
      {showDropdown && filteredUsers.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-[200] mt-1 w-64 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredUsers.map((user, index) => (
            <div
              key={user.user_id}
              className={cn(
                "px-3 py-2 cursor-pointer transition-colors",
                index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              )}
              onClick={() => insertMention(user)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="font-medium">{user.name}</div>
              {user.username && (
                <div className="text-xs text-muted-foreground">@{user.username}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
