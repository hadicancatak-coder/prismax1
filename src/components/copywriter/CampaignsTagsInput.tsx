import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

interface CampaignsTagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function CampaignsTagsInput({ value, onChange, disabled }: CampaignsTagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: campaigns = [] } = useUtmCampaigns();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(inputValue.toLowerCase()) &&
    !value.includes(c.name)
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
      setShowSuggestions(false);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSelectCampaign = (campaignName: string) => {
    if (!value.includes(campaignName)) {
      onChange([...value, campaignName]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  useEffect(() => {
    if (inputValue && filteredCampaigns.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, filteredCampaigns.length]);

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 items-center border rounded-md p-1 min-h-8 max-w-[200px]">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs gap-1">
            {tag}
            {!disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={() => removeTag(tag)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    removeTag(tag);
                  }
                }}
                className="hover:bg-muted rounded-full cursor-pointer inline-flex"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </Badge>
        ))}
        {!disabled && (
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && filteredCampaigns.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={value.length === 0 ? "Add campaign..." : ""}
            className="border-0 h-6 flex-1 min-w-[80px] p-0 focus-visible:ring-0 text-sm"
          />
        )}
      </div>
      
      {showSuggestions && filteredCampaigns.length > 0 && (
        <div className="absolute top-full left-0 z-10 mt-1 w-full min-w-[200px] max-h-[250px] rounded-md border border-border bg-popover text-popover-foreground shadow-sm overflow-auto">
          <Command className="border-0 bg-transparent">
            <CommandList>
              <CommandGroup>
                {filteredCampaigns.slice(0, 5).map((campaign) => (
                  <CommandItem
                    key={campaign.id}
                    onSelect={() => handleSelectCampaign(campaign.name)}
                    className="cursor-pointer"
                  >
                    {campaign.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandEmpty className="py-2 px-3 text-xs text-muted-foreground">
                Press Enter to add "{inputValue}" as custom campaign
              </CommandEmpty>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
