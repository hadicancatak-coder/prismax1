import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  Upload,
  Plus,
  Trash2,
  BarChart3,
  Palette,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SpreadsheetToolbarProps {
  onAddRow: () => void;
  onAddColumn: () => void;
  onDeleteRow: () => void;
  onDeleteColumn: () => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
  onCreateChart: () => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onSetAlignment: (align: 'left' | 'center' | 'right') => void;
  onSetBackgroundColor: (color: string) => void;
  onSetTextColor: (color: string) => void;
  hasSelection: boolean;
}

export function SpreadsheetToolbar({
  onAddRow,
  onAddColumn,
  onDeleteRow,
  onDeleteColumn,
  onExportCSV,
  onImportCSV,
  onCreateChart,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onSetAlignment,
  onSetBackgroundColor,
  onSetTextColor,
  hasSelection,
}: SpreadsheetToolbarProps) {
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onImportCSV(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-muted/30 flex-wrap">
      {/* File Actions */}
      <div className="flex items-center gap-1">
        <Button onClick={handleImportClick} size="sm" variant="ghost">
          <Upload className="h-4 w-4 mr-1" />
          Import CSV
        </Button>
        <Button onClick={onExportCSV} size="sm" variant="ghost">
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Row/Column Actions */}
      <div className="flex items-center gap-1">
        <Button onClick={onAddRow} size="sm" variant="ghost">
          <Plus className="h-4 w-4 mr-1" />
          Row
        </Button>
        <Button onClick={onAddColumn} size="sm" variant="ghost">
          <Plus className="h-4 w-4 mr-1" />
          Column
        </Button>
        <Button onClick={onDeleteRow} size="sm" variant="ghost" disabled={!hasSelection}>
          <Trash2 className="h-4 w-4 mr-1" />
          Row
        </Button>
        <Button onClick={onDeleteColumn} size="sm" variant="ghost" disabled={!hasSelection}>
          <Trash2 className="h-4 w-4 mr-1" />
          Column
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Formatting Actions */}
      <div className="flex items-center gap-1">
        <Button onClick={onToggleBold} size="sm" variant="ghost" disabled={!hasSelection}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button onClick={onToggleItalic} size="sm" variant="ghost" disabled={!hasSelection}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button onClick={onToggleUnderline} size="sm" variant="ghost" disabled={!hasSelection}>
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Alignment */}
      <div className="flex items-center gap-1">
        <Button onClick={() => onSetAlignment('left')} size="sm" variant="ghost" disabled={!hasSelection}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button onClick={() => onSetAlignment('center')} size="sm" variant="ghost" disabled={!hasSelection}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button onClick={() => onSetAlignment('right')} size="sm" variant="ghost" disabled={!hasSelection}>
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Colors */}
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" disabled={!hasSelection}>
              <Palette className="h-4 w-4 mr-1" />
              Colors
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <div>
                <Label htmlFor="bg-color" className="text-xs">Background Color</Label>
                <Input
                  id="bg-color"
                  type="color"
                  onChange={(e) => onSetBackgroundColor(e.target.value)}
                  className="h-8 w-full"
                />
              </div>
              <div>
                <Label htmlFor="text-color" className="text-xs">Text Color</Label>
                <Input
                  id="text-color"
                  type="color"
                  onChange={(e) => onSetTextColor(e.target.value)}
                  className="h-8 w-full"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Chart */}
      <Button onClick={onCreateChart} size="sm" variant="ghost" disabled={!hasSelection}>
        <BarChart3 className="h-4 w-4 mr-1" />
        Create Chart
      </Button>
    </div>
  );
}
