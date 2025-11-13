import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SpreadsheetCellProps {
  value: string;
  formula?: string;
  calculated?: number;
  isSelected: boolean;
  isFormula: boolean;
  onValueChange: (value: string) => void;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function SpreadsheetCell({
  value,
  formula,
  calculated,
  isSelected,
  isFormula,
  onValueChange,
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
    onValueChange(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onValueChange(editValue);
      onKeyDown(e);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    } else if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      setIsEditing(false);
      onValueChange(editValue);
      onKeyDown(e);
    }
  };

  const displayValue = isFormula && calculated !== undefined ? calculated.toString() : value;

  return (
    <div
      className={cn(
        "h-10 border border-border bg-background relative",
        isSelected && "ring-2 ring-primary",
        isFormula && "bg-blue-50 dark:bg-blue-950/20"
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
          className="w-full h-full px-2 text-sm bg-background border-0 focus:outline-none"
        />
      ) : (
        <div className="w-full h-full px-2 flex items-center text-sm truncate">
          {displayValue}
        </div>
      )}
    </div>
  );
}
