import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Palette,
  BarChart3,
  Download,
  Upload,
  Save,
  FolderOpen,
  Plus,
  Minus,
  Snowflake,
  ArrowUpDown,
  Filter,
  Sigma,
  Menu,
  FileText,
  Settings,
  HelpCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from "@/components/ui/menubar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EnhancedToolbarProps {
  onSave?: () => void;
  onOpen?: () => void;
  onNew?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onSetAlignment?: (align: 'left' | 'center' | 'right') => void;
  onSetBackgroundColor?: (color: string) => void;
  onSetTextColor?: (color: string) => void;
  onSetBorders?: (borderType: 'all' | 'outer' | 'none') => void;
  onFreeze?: (type: 'row' | 'column' | 'both') => void;
  onSort?: (direction: 'asc' | 'desc') => void;
  onFilter?: () => void;
  onCreateChart?: () => void;
  onAddRow?: () => void;
  onAddColumn?: () => void;
  onDeleteRow?: () => void;
  onDeleteColumn?: () => void;
  hasSelection?: boolean;
}

const commonColors = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
];

export function EnhancedToolbar({
  onSave,
  onOpen,
  onNew,
  onExport,
  onImport,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onSetAlignment,
  onSetBackgroundColor,
  onSetTextColor,
  onSetBorders,
  onFreeze,
  onSort,
  onFilter,
  onCreateChart,
  onAddRow,
  onAddColumn,
  onDeleteRow,
  onDeleteColumn,
  hasSelection = false,
}: EnhancedToolbarProps) {
  return (
    <div className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Tier 1: Menu Bar */}
      <div className="border-b border-border">
        <Menubar className="border-0 rounded-none h-10">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onNew}>
                New <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={onOpen}>
                Open <MenubarShortcut>⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onSave}>
                Save <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Download</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={onExport}>CSV (.csv)</MenubarItem>
                  <MenubarItem disabled>Excel (.xlsx)</MenubarItem>
                  <MenubarItem disabled>PDF (.pdf)</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarItem onClick={onImport}>Import CSV</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem disabled>
                Undo <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled>
                Redo <MenubarShortcut>⌘Y</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled>
                Cut <MenubarShortcut>⌘X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled>
                Copy <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled>
                Paste <MenubarShortcut>⌘V</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled>
                Find <MenubarShortcut>⌘F</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled>
                Find & Replace <MenubarShortcut>⌘H</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem disabled>Show formula bar</MenubarItem>
              <MenubarItem disabled>Show gridlines</MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Freeze</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={() => onFreeze?.('row')}>Freeze top row</MenubarItem>
                  <MenubarItem onClick={() => onFreeze?.('column')}>Freeze first column</MenubarItem>
                  <MenubarItem onClick={() => onFreeze?.('both')}>Freeze both</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarItem disabled>Full screen</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Insert</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onAddRow}>
                <Plus className="mr-2 h-4 w-4" />
                Row
              </MenubarItem>
              <MenubarItem onClick={onAddColumn}>
                <Plus className="mr-2 h-4 w-4" />
                Column
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onCreateChart}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Chart
              </MenubarItem>
              <MenubarItem disabled>Image</MenubarItem>
              <MenubarItem disabled>Link</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Format</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onToggleBold}>
                Bold <MenubarShortcut>⌘B</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={onToggleItalic}>
                Italic <MenubarShortcut>⌘I</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={onToggleUnderline}>
                Underline <MenubarShortcut>⌘U</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled>Number format</MenubarItem>
              <MenubarItem disabled>Conditional formatting</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Data</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => onSort?.('asc')}>Sort A → Z</MenubarItem>
              <MenubarItem onClick={() => onSort?.('desc')}>Sort Z → A</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onFilter}>Create filter</MenubarItem>
              <MenubarItem disabled>Remove duplicates</MenubarItem>
              <MenubarItem disabled>Data validation</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Tools</MenubarTrigger>
            <MenubarContent>
              <MenubarItem disabled>Spell check</MenubarItem>
              <MenubarItem disabled>Named ranges</MenubarItem>
              <MenubarItem disabled>Macros</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Keyboard shortcuts</MenubarItem>
              <MenubarItem>Function list</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Documentation</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* Tier 2: Formatting Controls */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-wrap">
        {/* Font Controls */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-32">
                Arial <ChevronDown className="ml-auto h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Arial</DropdownMenuItem>
              <DropdownMenuItem>Times New Roman</DropdownMenuItem>
              <DropdownMenuItem>Courier New</DropdownMenuItem>
              <DropdownMenuItem>Georgia</DropdownMenuItem>
              <DropdownMenuItem>Verdana</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-16">
                11 <ChevronDown className="ml-auto h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32].map(size => (
                <DropdownMenuItem key={size}>{size}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onToggleBold}
            disabled={!hasSelection}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onToggleItalic}
            disabled={!hasSelection}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onToggleUnderline}
            disabled={!hasSelection}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!hasSelection}>
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <div className="text-sm font-medium">Text Color</div>
                <div className="grid grid-cols-10 gap-1">
                  {commonColors.map(color => (
                    <button
                      key={color}
                      className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => onSetTextColor?.(color)}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!hasSelection}>
                <div className="relative">
                  <Palette className="h-4 w-4" />
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-yellow-400 rounded" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <div className="text-sm font-medium">Fill Color</div>
                <div className="grid grid-cols-10 gap-1">
                  {commonColors.map(color => (
                    <button
                      key={color}
                      className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => onSetBackgroundColor?.(color)}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onSetAlignment?.('left')}
            disabled={!hasSelection}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onSetAlignment?.('center')}
            disabled={!hasSelection}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onSetAlignment?.('right')}
            disabled={!hasSelection}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Borders */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!hasSelection}>
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onSetBorders?.('all')}>All borders</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetBorders?.('outer')}>Outer borders</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetBorders?.('none')}>No borders</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Number Format */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              123 <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Automatic</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Number</DropdownMenuItem>
            <DropdownMenuItem>Currency</DropdownMenuItem>
            <DropdownMenuItem>Percentage</DropdownMenuItem>
            <DropdownMenuItem>Date</DropdownMenuItem>
            <DropdownMenuItem>Time</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tier 3: Data & Functions */}
      <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Snowflake className="mr-2 h-4 w-4" />
              Freeze <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onFreeze?.('row')}>Freeze top row</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFreeze?.('column')}>Freeze first column</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFreeze?.('both')}>Freeze both</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onSort?.('asc')}>Sort A → Z</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort?.('desc')}>Sort Z → A</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="h-8" onClick={onFilter}>
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Sigma className="mr-2 h-4 w-4" />
              Functions <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>SUM</DropdownMenuItem>
            <DropdownMenuItem>AVERAGE</DropdownMenuItem>
            <DropdownMenuItem>COUNT</DropdownMenuItem>
            <DropdownMenuItem>MAX</DropdownMenuItem>
            <DropdownMenuItem>MIN</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>More functions...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="h-8" onClick={onCreateChart}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Chart
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="outline" size="sm" className="h-8" onClick={onAddRow}>
          <Plus className="mr-2 h-4 w-4" />
          Row
        </Button>

        <Button variant="outline" size="sm" className="h-8" onClick={onAddColumn}>
          <Plus className="mr-2 h-4 w-4" />
          Column
        </Button>
      </div>
    </div>
  );
}
