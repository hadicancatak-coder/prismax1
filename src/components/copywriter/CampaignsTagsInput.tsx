import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface CampaignsTagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function CampaignsTagsInput({ value, onChange, disabled }: CampaignsTagsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  return (
    <div className="flex flex-wrap gap-1 items-center border rounded-md p-1 min-h-8 max-w-[200px]">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs gap-1">
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-muted rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {!disabled && (
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Add campaign..." : ""}
          className="border-0 h-6 flex-1 min-w-[80px] p-0 focus-visible:ring-0 text-sm"
        />
      )}
    </div>
  );
}
