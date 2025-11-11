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
  const [fromDate, setFromDate] = useState<Date | undefined>(value?.from);
  const [toDate, setToDate] = useState<Date | undefined>(value?.to);

  const handlePreset = (from: Date, to: Date) => {
    setFromDate(from);
    setToDate(to);
    onChange({ from, to });
    onApply?.();
  };

  const handleFromSelect = (date: Date | undefined) => {
    setFromDate(date);
  };

  const handleToSelect = (date: Date | undefined) => {
    setToDate(date);
  };

  const handleClear = () => {
    setFromDate(undefined);
    setToDate(undefined);
    onChange(null);
  };

  const handleApply = () => {
    if (fromDate && toDate) {
      onChange({ from: fromDate, to: toDate });
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
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-muted-foreground">Custom Range</span>

        {/* Two Separate Date Pickers */}
        <div className="flex gap-3">
          {/* From Date Picker */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">From</span>
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={handleFromSelect}
              className="pointer-events-auto p-0 border rounded-md"
            />
            {fromDate && (
              <Badge variant="secondary" className="font-mono text-xs w-fit">
                {format(fromDate, "MMM d, yyyy")}
              </Badge>
            )}
          </div>

          {/* To Date Picker */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">To</span>
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={handleToSelect}
              disabled={(date) => fromDate ? date < fromDate : false}
              className="pointer-events-auto p-0 border rounded-md"
            />
            {toDate && (
              <Badge variant="secondary" className="font-mono text-xs w-fit">
                {format(toDate, "MMM d, yyyy")}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-1 border-t">
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs">
            Clear
          </Button>
          <Button 
            size="sm" 
            onClick={handleApply}
            disabled={!fromDate || !toDate}
            className="h-7 text-xs"
          >
            Apply Range
          </Button>
        </div>
      </div>
    </div>
  );
}
