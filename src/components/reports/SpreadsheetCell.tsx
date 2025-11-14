import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SpreadsheetCellProps {
  value: string;
  formula?: string;
  calculated?: boolean | number;
  isSelected: boolean;
  onChange: (value: string) => void;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function SpreadsheetCell({
  value,
  formula,
  calculated,
  isSelected,
  onChange,
  onSelect,
  onKeyDown,
}: SpreadsheetCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onChange(editValue);
      onKeyDown(e);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    } else if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      setIsEditing(false);
      onChange(editValue);
      onKeyDown(e);
    }
  };

  const displayValue = formula && calculated ? value : (formula || value);

  return (
    <div
      className={cn(
        "h-full w-full text-xs transition-colors",
        isSelected && "ring-2 ring-primary ring-inset",
        !isEditing && "cursor-cell hover:bg-muted/30"
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full px-1.5 py-0.5 bg-background border-0 outline-none text-xs font-mono"
        />
      ) : (
        <div
          className={cn(
            "h-full px-1.5 py-0.5 truncate",
            formula && "font-mono text-muted-foreground"
          )}
        >
          {displayValue}
        </div>
      )}
    </div>
  );
}
