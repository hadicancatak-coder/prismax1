import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FormulaAutocomplete } from "./FormulaAutocomplete";

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

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleCommit = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing) {
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
        setIsEditing(true);
        if (e.key === 'Backspace' || e.key === 'Delete') {
          setEditValue('');
        } else {
          setEditValue(e.key);
        }
      } else if (e.key === 'Enter') {
        setIsEditing(true);
      }
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
      onKeyDown={handleCellKeyDown}
      tabIndex={0}
    >
      {isEditing ? (
        <FormulaAutocomplete
          value={editValue}
          onChange={setEditValue}
          onCommit={handleCommit}
          onBlur={handleBlur}
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
