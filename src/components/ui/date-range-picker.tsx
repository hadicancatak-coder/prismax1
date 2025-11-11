import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dateRangePresets } from "@/lib/dateRangePresets";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

export type { DateRange };

interface DateRangePickerProps {
  value?: DateRange | null;
  onChange: (range: DateRange | null) => void;
  onApply?: () => void;
  presets?: 'full' | 'minimal';
}

export function DateRangePicker({ 
  value, 
  onChange, 
  onApply,
  presets = 'full' 
}: DateRangePickerProps) {
  // Internal tracking - what the user has selected
  const [tempFrom, setTempFrom] = useState<Date | undefined>(value?.from);
  const [tempTo, setTempTo] = useState<Date | undefined>(value?.to);
  const [calendarKey, setCalendarKey] = useState(0);

  // What we show to the Calendar - ONLY complete ranges
  const displayRange = (tempFrom && tempTo) ? { from: tempFrom, to: tempTo } : undefined;

  const handlePreset = (from: Date, to: Date) => {
    setTempFrom(from);
    setTempTo(to);
    onChange({ from, to });
    onApply?.();
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      // User clicked to deselect - clear everything
      setTempFrom(undefined);
      setTempTo(undefined);
      return;
    }
    
    // First click OR starting a new selection
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(range.from);
      setTempTo(undefined);
    } 
    // Second click - complete the range
    else if (tempFrom && !tempTo) {
      // If clicked date is before first date, swap them
      if (range.from < tempFrom) {
        setTempTo(tempFrom);
        setTempFrom(range.from);
      } else {
        setTempTo(range.from);
      }
    }
  };

  const handleClear = () => {
    setTempFrom(undefined);
    setTempTo(undefined);
    setCalendarKey(prev => prev + 1); // Force complete remount
    onChange(null);
  };

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onChange({ from: tempFrom, to: tempTo });
      onApply?.();
    }
  };

  return (
    <div className="flex gap-3 p-3">
      {/* Left: Preset Buttons */}
      <div className="flex flex-col gap-1 min-w-[110px]">
        <span className="text-xs font-medium text-muted-foreground mb-1">Quick Select</span>
        <Button 
          size="sm" 
          variant="ghost" 
          className="justify-start h-7 px-2 text-xs" 
          onClick={() => {
            const preset = dateRangePresets.today();
            handlePreset(preset.from, preset.to);
          }}
        >
          Today
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="justify-start h-7 px-2 text-xs"
          onClick={() => {
            const preset = dateRangePresets.yesterday();
            handlePreset(preset.from, preset.to);
          }}
        >
          Yesterday
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="justify-start h-7 px-2 text-xs"
          onClick={() => {
            const preset = dateRangePresets.thisWeek();
            handlePreset(preset.from, preset.to);
          }}
        >
          This Week
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="justify-start h-7 px-2 text-xs"
          onClick={() => {
            const preset = dateRangePresets.lastWeek();
            handlePreset(preset.from, preset.to);
          }}
        >
          Last Week
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="justify-start h-7 px-2 text-xs"
          onClick={() => {
            const preset = dateRangePresets.nextWeek();
            handlePreset(preset.from, preset.to);
          }}
        >
          Next Week
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="justify-start h-7 px-2 text-xs"
          onClick={() => {
            const preset = dateRangePresets.thisMonth();
            handlePreset(preset.from, preset.to);
          }}
        >
          This Month
        </Button>
        {presets === 'full' && (
          <>
            <Button 
              size="sm" 
              variant="ghost" 
              className="justify-start h-7 px-2 text-xs"
              onClick={() => {
                const preset = dateRangePresets.lastMonth();
                handlePreset(preset.from, preset.to);
              }}
            >
              Last Month
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="justify-start h-7 px-2 text-xs"
              onClick={() => {
                const preset = dateRangePresets.thisQuarter();
                handlePreset(preset.from, preset.to);
              }}
            >
              This Quarter
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="justify-start h-7 px-2 text-xs"
              onClick={() => {
                const preset = dateRangePresets.lastQuarter();
                handlePreset(preset.from, preset.to);
              }}
            >
              Last Quarter
            </Button>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="w-px bg-border" />

      {/* Right: Custom Range Selector */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Custom Range</span>

        {/* Single Calendar with Range Mode */}
        <Calendar
          mode="range"
          selected={displayRange}
          onSelect={handleDateSelect}
          numberOfMonths={1}
          key={calendarKey}
          className="pointer-events-auto p-0"
        />

        {/* Selected Range Display */}
        {tempFrom && (
          <div className="flex items-center gap-2 text-xs px-2">
            <span className="text-muted-foreground">
              {tempTo ? "Range:" : "From:"}
            </span>
            <Badge variant="secondary" className="font-mono text-xs">
              {format(tempFrom, "MMM d, yyyy")}
            </Badge>
            {tempTo && (
              <>
                <span className="text-muted-foreground">→</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {format(tempTo, "MMM d, yyyy")}
                </Badge>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-1 border-t">
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs">
            Clear
          </Button>
          <Button 
            size="sm" 
            onClick={handleApply}
            disabled={!tempFrom || !tempTo}
            className="h-7 text-xs"
          >
            Apply Range
          </Button>
        </div>
      </div>
    </div>
  );
}
