import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [selectingMode, setSelectingMode] = useState<'from' | 'to'>('from');

  const handlePreset = (from: Date, to: Date) => {
    setTempFrom(from);
    setTempTo(to);
    onChange({ from, to });
    onApply?.();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (selectingMode === 'from') {
      setTempFrom(date);
      if (tempTo && date > tempTo) {
        setTempTo(undefined);
      }
      setSelectingMode('to');
    } else {
      if (tempFrom && date < tempFrom) {
        setTempTo(tempFrom);
        setTempFrom(date);
      } else {
        setTempTo(date);
      }
    }
  };

  const handleClear = () => {
    setTempFrom(undefined);
    setTempTo(undefined);
    setSelectingMode('from');
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
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Custom Range</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={selectingMode === 'from' ? 'default' : 'outline'}
              className="h-6 px-2 text-xs"
              onClick={() => setSelectingMode('from')}
            >
              From
            </Button>
            <Button
              size="sm"
              variant={selectingMode === 'to' ? 'default' : 'outline'}
              className="h-6 px-2 text-xs"
              onClick={() => setSelectingMode('to')}
            >
              To
            </Button>
          </div>
        </div>

        {/* Single Calendar */}
        <Calendar
          mode="single"
          selected={selectingMode === 'from' ? tempFrom : tempTo}
          onSelect={handleDateSelect}
          disabled={(date) => selectingMode === 'to' && tempFrom ? date < tempFrom : false}
          className="pointer-events-auto p-0"
        />

        {/* Selected Range Display */}
        {(tempFrom || tempTo) && (
          <div className="flex items-center gap-2 text-xs px-2">
            <span className="text-muted-foreground">Range:</span>
            {tempFrom && (
              <Badge variant="secondary" className="font-mono text-xs">
                {format(tempFrom, "MMM d, yyyy")}
              </Badge>
            )}
            {tempFrom && tempTo && <span className="text-muted-foreground">→</span>}
            {tempTo && (
              <Badge variant="secondary" className="font-mono text-xs">
                {format(tempTo, "MMM d, yyyy")}
              </Badge>
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
