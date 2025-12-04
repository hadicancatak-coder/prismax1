import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, BookmarkPlus, Copy } from "lucide-react";
import { SavedElementsSelector } from "@/components/search/SavedElementsSelector";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";
import { ElementType } from "@/config/searchAdsConfig";

interface SearchPlannerCaptionFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength: number;
  warningThreshold: number;
  dangerThreshold: number;
  elementType: ElementType;
  entity: string;
  language: string;
  onSaveElement: () => void;
  multiline?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchPlannerCaptionField({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  warningThreshold,
  dangerThreshold,
  elementType,
  entity,
  language,
  onSaveElement,
  multiline = false,
  required = false,
  disabled = false,
  className,
}: SearchPlannerCaptionFieldProps) {
  const { copy } = useCopyToClipboard();
  const [showSaved, setShowSaved] = useState(false);
  
  const charCount = value.length;
  const isEmpty = !value.trim();
  
  // Determine character count color based on thresholds
  const getCounterColor = () => {
    if (charCount < warningThreshold) return "text-success";
    if (charCount < dangerThreshold) return "text-warning";
    return "text-destructive";
  };

  const handleSelectSaved = (content: string) => {
    onChange(content);
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={cn("space-y-xs", className)}>
      {/* Label row with counter */}
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-body-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-xs">*</span>}
        </Label>
        <span className={cn("text-metadata font-medium", getCounterColor())}>
          {charCount}/{maxLength}
        </span>
      </div>
      
      {/* Input with action buttons */}
      <div className="flex items-start gap-xs">
        <InputComponent
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            "flex-1 bg-card border-input transition-smooth",
            "focus:ring-2 focus:ring-primary/20 focus:border-primary",
            multiline && "min-h-[80px] resize-none"
          )}
        />
        
        {/* Action buttons */}
        <div className="flex items-center gap-xs">
          {/* Use Saved Caption */}
          <SavedElementsSelector
            elementType={elementType}
            entity={entity}
            language={language}
            onSelect={handleSelectSaved}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent transition-smooth"
                title="Use saved caption"
                disabled={disabled}
              >
                <Download className="h-4 w-4" />
              </Button>
            }
          />
          
          {/* Save to Library */}
          {!isEmpty && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent transition-smooth"
              onClick={onSaveElement}
              title="Save to library"
              disabled={disabled}
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
          )}
          
          {/* Copy to Clipboard */}
          {!isEmpty && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent transition-smooth"
              onClick={() => copy(value)}
              title="Copy to clipboard"
              disabled={disabled}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
