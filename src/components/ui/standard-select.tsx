import * as React from "react";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface BaseSelectProps {
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  allowCustom?: boolean;
  onAddCustom?: (value: string) => Promise<void> | void;
}

interface SingleSelectProps extends BaseSelectProps {
  mode?: "single";
  value?: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps extends BaseSelectProps {
  mode: "multi";
  value: string[];
  onChange: (value: string[]) => void;
}

type StandardSelectProps = SingleSelectProps | MultiSelectProps;

export function StandardSelect(props: StandardSelectProps) {
  const {
    options,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    disabled = false,
    className,
    allowCustom = false,
    onAddCustom,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  const isMulti = props.mode === "multi";
  const selectedValues = isMulti ? props.value : props.value ? [props.value] : [];

  const handleSelect = (optionValue: string) => {
    if (isMulti) {
      const currentValues = props.value;
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      props.onChange(newValues);
    } else {
      props.onChange(optionValue);
      setOpen(false);
    }
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMulti) {
      props.onChange(props.value.filter((v) => v !== optionValue));
    }
  };

  const handleAddCustom = async () => {
    if (!customValue.trim() || !onAddCustom) return;
    setIsAdding(true);
    try {
      await onAddCustom(customValue.trim());
      setCustomValue("");
    } finally {
      setIsAdding(false);
    }
  };

  const getDisplayValue = () => {
    if (isMulti) {
      if (props.value.length === 0) return placeholder;
      return (
        <div className="flex flex-wrap gap-1 max-w-full">
          {props.value.slice(0, 3).map((val) => {
            const option = options.find((o) => o.value === val);
            return (
              <Badge
                key={val}
                variant="secondary"
                className="text-metadata px-1.5 py-0 h-5 gap-1 transition-smooth hover:bg-destructive/20"
              >
                <span className="truncate max-w-[100px]">{option?.label || val}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive transition-smooth"
                  onClick={(e) => handleRemove(val, e)}
                />
              </Badge>
            );
          })}
          {props.value.length > 3 && (
            <Badge variant="outline" className="text-metadata px-1.5 py-0 h-5">
              +{props.value.length - 3}
            </Badge>
          )}
        </div>
      );
    }

    const selected = options.find((o) => o.value === props.value);
    return selected?.label || placeholder;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal transition-smooth",
            !selectedValues.length && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate flex-1 text-left">{getDisplayValue()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 hide-scrollbar" 
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList className="hide-scrollbar max-h-[200px]">
            <CommandEmpty>
              {allowCustom && customValue ? (
                <div className="p-2 space-y-2">
                  <p className="text-metadata text-muted-foreground">{emptyText}</p>
                  <div className="flex gap-2">
                    <Input
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder="Add new..."
                      className="h-8 text-body-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddCustom}
                      disabled={!customValue.trim() || isAdding}
                      className="h-8 transition-smooth"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-metadata text-muted-foreground py-2">{emptyText}</p>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => handleSelect(option.value)}
                  className="transition-smooth cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 transition-smooth",
                      selectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {allowCustom && (
              <div className="border-t p-2">
                <div className="flex gap-2">
                  <Input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Add new..."
                    className="h-8 text-body-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustom();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddCustom}
                    disabled={!customValue.trim() || isAdding}
                    className="h-8 transition-smooth"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Convenience exports for common use cases
export function SingleSelect(props: Omit<SingleSelectProps, "mode">) {
  return <StandardSelect {...props} mode="single" />;
}

export function MultiSelect(props: Omit<MultiSelectProps, "mode">) {
  return <StandardSelect {...props} mode="multi" />;
}
