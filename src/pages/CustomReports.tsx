import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCustomReports } from '@/hooks/useCustomReports';
import { useSpreadsheetKeyboard } from '@/hooks/useSpreadsheetKeyboard';
import { AdvancedSpreadsheet } from '@/components/reports/AdvancedSpreadsheet';
import { EnhancedToolbar } from '@/components/reports/EnhancedToolbar';
import { FindReplaceDialog } from '@/components/reports/FindReplaceDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, FolderOpen, Download, Keyboard } from 'lucide-react';
import type { AdvancedSpreadsheetData, ChartConfig } from '@/types/spreadsheet';

export default function CustomReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { reports, createReport, updateReport, isCreating, isUpdating } = useCustomReports();

  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetName, setSpreadsheetName] = useState('Untitled Spreadsheet');
  const [spreadsheetData, setSpreadsheetData] = useState<AdvancedSpreadsheetData>({});
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [frozenRows, setFrozenRows] = useState(0);
  const [frozenColumns, setFrozenColumns] = useState(0);
  const [filterActive, setFilterActive] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const spreadsheetRef = useRef<any>(null);

  const handleSave = useCallback(async () => {
    if (!user) return;

    const spreadsheetDoc = {
      name: spreadsheetName,
      elements: {
        cells: spreadsheetData,
        charts: charts,
        frozenRows: frozenRows,
        frozenColumns: frozenColumns,
      },
      user_id: user.id,
    };

    try {
      if (spreadsheetId) {
        updateReport({
          id: spreadsheetId,
          ...spreadsheetDoc,
          updated_at: new Date().toISOString(),
        } as any);
      } else {
        const newReport: any = await new Promise((resolve) => {
          createReport({
            ...spreadsheetDoc,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any);
          setTimeout(() => resolve({ id: crypto.randomUUID() }), 100);
        });
        setSpreadsheetId(newReport.id);
      }
      toast({
        title: 'Saved',
        description: 'Spreadsheet saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save spreadsheet',
        variant: 'destructive',
      });
    }
  }, [user, spreadsheetId, spreadsheetName, spreadsheetData, charts, frozenRows, frozenColumns, createReport, updateReport, toast]);

  const handleLoad = useCallback((reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    setSpreadsheetId(report.id);
    setSpreadsheetName(report.name);
    
    const data = report.elements as any;
    setSpreadsheetData(data?.cells || {});
    setCharts(data?.charts || []);
    setFrozenRows(data?.frozenRows || 0);
    setFrozenColumns(data?.frozenColumns || 0);

    toast({
      title: 'Loaded',
      description: `Loaded "${report.name}"`,
    });
  }, [reports, toast]);

  const handleExport = useCallback(() => {
    const rows: string[][] = [];
    const cellKeys = Object.keys(spreadsheetData);
    
    if (cellKeys.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'The spreadsheet is empty',
        variant: 'destructive',
      });
      return;
    }

    let maxRow = 0;
    let maxCol = 0;
    cellKeys.forEach(key => {
      const match = key.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = match[1].charCodeAt(0) - 65;
        const row = parseInt(match[2]) - 1;
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);
      }
    });

    for (let r = 0; r <= maxRow; r++) {
      const row: string[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cellKey = `${String.fromCharCode(65 + c)}${r + 1}`;
        const cellData = spreadsheetData[cellKey];
        const value = cellData?.value?.toString() || '';
        row.push(`"${value.replace(/"/g, '""')}"`);
      }
      rows.push(row);
    }

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spreadsheetName}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exported', description: 'CSV file downloaded' });
  }, [spreadsheetData, spreadsheetName, toast]);

  const handleNew = useCallback(() => {
    setSpreadsheetId(null);
    setSpreadsheetName('Untitled Spreadsheet');
    setSpreadsheetData({});
    setCharts([]);
    setFrozenRows(0);
    setFrozenColumns(0);
    setFilterActive(false);
  }, []);

  const handleFreeze = useCallback((type: 'row' | 'column' | 'both' | 'none') => {
    if (type === 'row') {
      setFrozenRows(1);
      setFrozenColumns(0);
    } else if (type === 'column') {
      setFrozenRows(0);
      setFrozenColumns(1);
    } else if (type === 'both') {
      setFrozenRows(1);
      setFrozenColumns(1);
    } else {
      setFrozenRows(0);
      setFrozenColumns(0);
    }
  }, []);

  const handleSort = useCallback((direction: 'asc' | 'desc') => {
    if (spreadsheetRef.current?.handleSort) {
      spreadsheetRef.current.handleSort(direction);
    }
  }, []);

  const handleFilter = useCallback(() => {
    setFilterActive(prev => !prev);
  }, []);

  const handleInsertRow = useCallback(() => {
    if (spreadsheetRef.current?.insertRow) {
      spreadsheetRef.current.insertRow('above');
    }
  }, []);

  const handleInsertColumn = useCallback(() => {
    if (spreadsheetRef.current?.insertColumn) {
      spreadsheetRef.current.insertColumn('left');
    }
  }, []);

  const handleDeleteRow = useCallback(() => {
    if (spreadsheetRef.current?.deleteRow) {
      spreadsheetRef.current.deleteRow();
    }
  }, []);

  const handleDeleteColumn = useCallback(() => {
    if (spreadsheetRef.current?.deleteColumn) {
      spreadsheetRef.current.deleteColumn();
    }
  }, []);

  const handleReplace = useCallback((findText: string, replaceText: string, options: any) => {
    const newData = { ...spreadsheetData };
    let replacedCount = 0;

    Object.keys(newData).forEach(cellKey => {
      const cell = newData[cellKey];
      if (!cell) return;

      const searchIn = options.searchFormulas ? (cell.formula || cell.value.toString()) : cell.value.toString();
      const matches = options.matchCase 
        ? searchIn.includes(findText)
        : searchIn.toLowerCase().includes(findText.toLowerCase());

      if (matches) {
        if (options.matchEntireCell) {
          if (options.matchCase ? searchIn === findText : searchIn.toLowerCase() === findText.toLowerCase()) {
            if (options.searchFormulas && cell.formula) {
              cell.formula = replaceText;
            } else {
              cell.value = replaceText;
            }
            replacedCount++;
          }
        } else {
          const regex = new RegExp(findText, options.matchCase ? 'g' : 'gi');
          if (options.searchFormulas && cell.formula) {
            cell.formula = cell.formula.replace(regex, replaceText);
            replacedCount++;
          } else {
            const newValue = cell.value.toString().replace(regex, replaceText);
            cell.value = newValue;
            replacedCount++;
          }
        }
      }
    });

    setSpreadsheetData(newData);
    toast({ title: 'Replace complete', description: `Replaced ${replacedCount} occurrence(s)` });
  }, [spreadsheetData, toast]);

  useSpreadsheetKeyboard({
    onSave: handleSave,
    onNew: handleNew,
    onFind: () => setFindReplaceOpen(true),
    onFindReplace: () => setFindReplaceOpen(true),
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="h-12 border-b border-border bg-card px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Input
            value={spreadsheetName}
            onChange={(e) => setSpreadsheetName(e.target.value)}
            className="max-w-xs font-medium"
            placeholder="Spreadsheet name"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleNew} title="New spreadsheet">
              New
            </Button>
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={isCreating || isUpdating} title="Save (Ctrl+S)">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => reports.length > 0 && handleLoad(reports[0].id)} title="Load spreadsheet">
              <FolderOpen className="w-4 h-4 mr-2" />
              Load
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExport} title="Export to CSV">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="w-3 h-3" />
          <span>Ctrl+S: Save | Ctrl+F: Find | F2: Edit</span>
        </div>
      </div>

      <EnhancedToolbar
        hasSelection={!!selectedCell}
        frozenRows={frozenRows}
        frozenColumns={frozenColumns}
        onSave={handleSave}
        onNew={handleNew}
        onFreeze={handleFreeze}
        onSort={handleSort}
        onFilter={handleFilter}
        onInsertRow={handleInsertRow}
        onInsertColumn={handleInsertColumn}
        onDeleteRow={handleDeleteRow}
        onDeleteColumn={handleDeleteColumn}
      />

      <div className="flex-1 overflow-hidden">
        <AdvancedSpreadsheet
          initialData={spreadsheetData}
          onDataChange={setSpreadsheetData}
        />
      </div>

      <FindReplaceDialog
        open={findReplaceOpen}
        onOpenChange={setFindReplaceOpen}
        onReplace={handleReplace}
        cellData={spreadsheetData}
      />
    </div>
  );
}
