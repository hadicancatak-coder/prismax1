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
  Table,
  FileText,
  Image,
  Save,
  FolderOpen,
  Square,
  Library,
  Combine,
  Split,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SpreadsheetToolbarProps {
  onAddElement?: (type: 'table' | 'text' | 'chart' | 'image') => void;
  onAddRow?: () => void;
  onAddColumn?: () => void;
  onDeleteRow?: () => void;
  onDeleteColumn?: () => void;
  onExportCSV?: () => void;
  onImportCSV?: (file: File) => void;
  onCreateChart?: () => void;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onSetAlignment?: (align: 'left' | 'center' | 'right') => void;
  onSetBackgroundColor?: (color: string) => void;
  onSetTextColor?: (color: string) => void;
  onSetBorders?: (borderType: 'all' | 'outer' | 'top' | 'bottom' | 'left' | 'right' | 'none') => void;
  onMergeCells?: () => void;
  onSplitCells?: () => void;
  onToggleFormulaLibrary?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  hasSelection?: boolean;
}

export function SpreadsheetToolbar({
  onAddElement,
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
  onSetBorders,
  onMergeCells,
  onSplitCells,
  onToggleFormulaLibrary,
  onSave,
  onLoad,
  hasSelection = false,
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
    <div className="sticky top-0 z-50 flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-[#282E33] flex-wrap">
      {/* Insert Section */}
      {onAddElement && (
        <>
          <div className="flex items-center gap-1 pr-4 border-r border-white/10">
            <span className="text-sm font-medium text-white mr-2">Insert</span>
            <Button onClick={() => onAddElement('table')} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
              <Table className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button onClick={() => onAddElement('text')} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
              <FileText className="h-4 w-4 mr-1" />
              Text
            </Button>
            <Button onClick={() => onAddElement('chart')} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
              <BarChart3 className="h-4 w-4 mr-1" />
              Chart
            </Button>
            <Button onClick={() => onAddElement('image')} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
              <Image className="h-4 w-4 mr-1" />
              Image
            </Button>
          </div>
        </>
      )}

      {/* File Actions */}
      {(onSave || onLoad || onImportCSV || onExportCSV) && (
        <div className="flex items-center gap-1 pr-4 border-r border-white/10">
          <span className="text-sm font-medium text-white mr-2">File</span>
          {onSave && (
            <Button onClick={onSave} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}
          {onLoad && (
            <Button onClick={onLoad} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
              <FolderOpen className="h-4 w-4 mr-1" />
              Load
            </Button>
          )}
          {onImportCSV && (
            <Button onClick={handleImportClick} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
          )}
          {onExportCSV && (
            <Button onClick={onExportCSV} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      )}

      {/* Data Section */}
      {(onAddRow || onAddColumn || onDeleteRow || onDeleteColumn) && (
        <div className="flex items-center gap-1 pr-4 border-r border-white/10">
          <span className="text-sm font-medium text-white mr-2">Data</span>
          {onAddRow && (
            <Button onClick={onAddRow} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
              <Plus className="h-4 w-4 mr-1" />
              Row
            </Button>
          )}
          {onAddColumn && (
            <Button onClick={onAddColumn} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
              <Plus className="h-4 w-4 mr-1" />
              Column
            </Button>
          )}
          {onDeleteRow && (
            <Button onClick={onDeleteRow} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
              <Trash2 className="h-4 w-4 mr-1" />
              Row
            </Button>
          )}
          {onDeleteColumn && (
            <Button onClick={onDeleteColumn} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
              <Trash2 className="h-4 w-4 mr-1" />
              Column
            </Button>
          )}
        </div>
      )}

      {/* Format Section */}
      {(onToggleBold || onToggleItalic || onToggleUnderline || onSetAlignment) && (
        <div className="flex items-center gap-1 pr-4 border-r border-white/10">
          <span className="text-sm font-medium text-white mr-2">Format</span>
          {onToggleBold && (
            <Button onClick={onToggleBold} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
              <Bold className="h-4 w-4" />
            </Button>
          )}
          {onToggleItalic && (
            <Button onClick={onToggleItalic} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
              <Italic className="h-4 w-4" />
            </Button>
          )}
          {onToggleUnderline && (
            <Button onClick={onToggleUnderline} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
              <Underline className="h-4 w-4" />
            </Button>
          )}
          {onSetAlignment && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button onClick={() => onSetAlignment('left')} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button onClick={() => onSetAlignment('center')} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button onClick={() => onSetAlignment('right')} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
                <AlignRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Colors Section */}
      {(onSetBackgroundColor || onSetTextColor) && (
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-white mr-2">Colors</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
                <Palette className="h-4 w-4 mr-1" />
                Pick
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                {onSetBackgroundColor && (
                  <div className="space-y-1.5">
                    <Label htmlFor="bg-color" className="text-xs">Background</Label>
                    <Input
                      id="bg-color"
                      type="color"
                      onChange={(e) => onSetBackgroundColor?.(e.target.value)}
                      className="h-8 w-full cursor-pointer"
                    />
                  </div>
                )}
                {onSetTextColor && (
                  <div className="space-y-1.5">
                    <Label htmlFor="text-color" className="text-xs">Text</Label>
                    <Input
                      id="text-color"
                      type="color"
                      onChange={(e) => onSetTextColor?.(e.target.value)}
                      className="h-8 w-full cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Chart */}
      {onCreateChart && (
        <Button onClick={onCreateChart} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
          <BarChart3 className="h-4 w-4 mr-1" />
          Chart
        </Button>
      )}

      {/* Borders & Merge Section */}
      {(onSetBorders || onMergeCells || onSplitCells) && (
        <div className="flex items-center gap-1">
          {onSetBorders && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
                  <Square className="h-4 w-4 mr-1" />
                  Borders
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onSetBorders('all')}>All Borders</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetBorders('outer')}>Outer Border</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetBorders('top')}>Top Border</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetBorders('bottom')}>Bottom Border</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetBorders('left')}>Left Border</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetBorders('right')}>Right Border</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSetBorders('none')}>No Borders</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onMergeCells && (
            <Button onClick={onMergeCells} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
              <Combine className="h-4 w-4 mr-1" />
              Merge
            </Button>
          )}
          {onSplitCells && (
            <Button onClick={onSplitCells} size="sm" variant="ghost" disabled={!hasSelection} className="hover:bg-[#2C3237]">
              <Split className="h-4 w-4 mr-1" />
              Split
            </Button>
          )}
        </div>
      )}

      {/* Formula Library Toggle */}
      {onToggleFormulaLibrary && (
        <div className="flex items-center gap-1 ml-auto">
          <Button onClick={onToggleFormulaLibrary} size="sm" variant="ghost" className="hover:bg-[#2C3237]">
            <Library className="h-4 w-4 mr-1" />
            Formulas
          </Button>
        </div>
      )}
    </div>
  );
}
