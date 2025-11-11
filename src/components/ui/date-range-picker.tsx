import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { dateRangePresets } from "@/lib/dateRangePresets";
import { format } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

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
  const [tempFrom, setTempFrom] = useState<Date | undefined>(value?.from);
  const [tempTo, setTempTo] = useState<Date | undefined>(value?.to);

  // Sync with external value changes
  useEffect(() => {
    setTempFrom(value?.from);
    setTempTo(value?.to);
  }, [value]);

  const handlePreset = (from: Date, to: Date, label: string) => {
    setTempFrom(from);
    setTempTo(to);
    onChange({ from, to });
    onApply?.();
  };

  const handleClear = () => {
    setTempFrom(undefined);
    setTempTo(undefined);
    onChange(null);
  };

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onChange({ from: tempFrom, to: tempTo });
      onApply?.();
    }
  };

  const handleFromSelect = (date: Date | undefined) => {
    setTempFrom(date);
    // If from date is after to date, clear to date
    if (date && tempTo && date > tempTo) {
      setTempTo(undefined);
    }
  };

  const handleToSelect = (date: Date | undefined) => {
    setTempTo(date);
    // Auto-apply when both dates are selected
    if (tempFrom && date) {
      onChange({ from: tempFrom, to: date });
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Preset Buttons */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Quick Select</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const preset = dateRangePresets.today();
              handlePreset(preset.from, preset.to, preset.label);
            }}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const preset = dateRangePresets.yesterday();
              handlePreset(preset.from, preset.to, preset.label);
            }}
          >
            Yesterday
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const preset = dateRangePresets.thisWeek();
              handlePreset(preset.from, preset.to, preset.label);
            }}
          >
            This Week
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const preset = dateRangePresets.lastWeek();
              handlePreset(preset.from, preset.to, preset.label);
            }}
          >
            Last Week
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const preset = dateRangePresets.nextWeek();
              handlePreset(preset.from, preset.to, preset.label);
            }}
          >
            Next Week
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const preset = dateRangePresets.thisMonth();
              handlePreset(preset.from, preset.to, preset.label);
            }}
          >
            This Month
          </Button>
          {presets === 'full' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const preset = dateRangePresets.lastMonth();
                  handlePreset(preset.from, preset.to, preset.label);
                }}
              >
                Last Month
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const preset = dateRangePresets.thisQuarter();
                  handlePreset(preset.from, preset.to, preset.label);
                }}
              >
                This Quarter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const preset = dateRangePresets.lastQuarter();
                  handlePreset(preset.from, preset.to, preset.label);
                }}
              >
                Last Quarter
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Custom Range Selector */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Or Select Custom Range</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">From</Label>
            <Calendar
              mode="single"
              selected={tempFrom}
              onSelect={handleFromSelect}
              className="pointer-events-auto p-0"
            />
            {tempFrom && (
              <p className="text-xs text-center text-muted-foreground">
                {format(tempFrom, "MMM d, yyyy")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">To</Label>
            <Calendar
              mode="single"
              selected={tempTo}
              onSelect={handleToSelect}
              disabled={(date) => !tempFrom || date < tempFrom}
              className="pointer-events-auto p-0"
            />
            {tempTo && (
              <p className="text-xs text-center text-muted-foreground">
                {format(tempTo, "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
        <Button 
          size="sm" 
          onClick={handleApply}
          disabled={!tempFrom || !tempTo}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
