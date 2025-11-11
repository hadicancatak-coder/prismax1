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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    value ? { from: value.from, to: value.to } : undefined
  );
  const [calendarKey, setCalendarKey] = useState(0);

  const handlePreset = (from: Date, to: Date) => {
    setDateRange({ from, to });
    onChange({ from, to });
    onApply?.();
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleClear = () => {
    setDateRange(undefined);
    setCalendarKey(prev => prev + 1); // Force complete remount
    onChange(null);
  };

  const handleApply = () => {
    if (dateRange?.from && dateRange?.to) {
      onChange(dateRange);
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
          selected={dateRange}
          onSelect={handleDateSelect}
          numberOfMonths={1}
          key={calendarKey}
          className="pointer-events-auto p-0"
        />

        {/* Selected Range Display */}
        {dateRange?.from && (
          <div className="flex items-center gap-2 text-xs px-2">
            <span className="text-muted-foreground">Range:</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {format(dateRange.from, "MMM d, yyyy")}
            </Badge>
            {dateRange.to && (
              <>
                <span className="text-muted-foreground">→</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {format(dateRange.to, "MMM d, yyyy")}
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
            disabled={!dateRange?.from || !dateRange?.to}
            className="h-7 text-xs"
          >
            Apply Range
          </Button>
        </div>
      </div>
    </div>
  );
}
