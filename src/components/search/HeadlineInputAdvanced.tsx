import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeadlineInputAdvancedProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function HeadlineInputAdvanced({
  value,
  onChange,
  placeholder = "Enter headline",
  maxLength = 30,
}: HeadlineInputAdvancedProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const charCount = value.length;
  const charPercentage = (charCount / maxLength) * 100;

  const getCharCountColor = () => {
    if (charPercentage > 100) return "text-destructive";
    if (charPercentage > 90) return "text-warning";
    return "text-success";
  };

  return (
    <div className="space-y-xs">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength + 10} // Allow slight overflow for visual feedback
          className="pr-24"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-xs">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <Sparkles className="h-3 w-3 text-primary" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
          >
            <Database className="h-3 w-3 text-muted-foreground" />
          </Button>
          <span className={cn("text-metadata font-medium transition-smooth", getCharCountColor())}>
            {charCount}/{maxLength}
          </span>
        </div>
      </div>

      {showSuggestions && (
        <div className="p-sm bg-muted/50 rounded-lg border border-border space-y-xs animate-fade-in">
          <p className="text-metadata text-muted-foreground">AI Suggestions:</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start text-left h-auto py-xs"
            onClick={() => {
              onChange("Best Forex Trading Platform");
              setShowSuggestions(false);
            }}
          >
            Best Forex Trading Platform
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start text-left h-auto py-xs"
            onClick={() => {
              onChange("Trade Forex with Confidence");
              setShowSuggestions(false);
            }}
          >
            Trade Forex with Confidence
          </Button>
        </div>
      )}
    </div>
  );
}
