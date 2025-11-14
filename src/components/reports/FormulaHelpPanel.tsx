import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FORMULA_TEMPLATES, FORMULA_DESCRIPTIONS } from '@/lib/formulaSyntaxHighlighter';

interface FormulaHelpPanelProps {
  onClose: () => void;
}

const FORMULA_EXAMPLES = {
  SUM: {
    syntax: '=SUM(range)',
    example: '=SUM(A1:A10)',
    result: 'Adds: 5 + 10 + 15 + ... = 55',
    description: 'Adds all numbers in the specified range. You can also add multiple ranges or individual cells: =SUM(A1:A5, B1:B5, C1)',
  },
  AVERAGE: {
    syntax: '=AVERAGE(range)',
    example: '=AVERAGE(A1:A10)',
    result: 'Returns: 11 (average of all values)',
    description: 'Calculates the arithmetic mean of all numbers in the range. Empty cells are ignored.',
  },
  COUNT: {
    syntax: '=COUNT(range)',
    example: '=COUNT(A1:A10)',
    result: 'Returns: 10 (number of cells)',
    description: 'Counts how many cells contain numeric values. Empty cells and text are ignored.',
  },
  MIN: {
    syntax: '=MIN(range)',
    example: '=MIN(A1:A10)',
    result: 'Returns: 5 (smallest value)',
    description: 'Returns the minimum value in the range.',
  },
  MAX: {
    syntax: '=MAX(range)',
    example: '=MAX(A1:A10)',
    result: 'Returns: 100 (largest value)',
    description: 'Returns the maximum value in the range.',
  },
  IF: {
    syntax: '=IF(condition, value_if_true, value_if_false)',
    example: '=IF(A1>10, "High", "Low")',
    result: 'Returns: "High" if A1 > 10, otherwise "Low"',
    description: 'Evaluates a condition and returns one value if true, another if false. Supports comparison operators: >, <, =, >=, <=',
  },
  VLOOKUP: {
    syntax: '=VLOOKUP(lookup_value, table_range, column_index)',
    example: '=VLOOKUP(A1, A1:C10, 2)',
    result: 'Looks up A1 in first column, returns value from column 2',
    description: 'Searches for a value in the first column of a range and returns a value in the same row from a specified column.',
  },
};

export function FormulaHelpPanel({ onClose }: FormulaHelpPanelProps) {
  return (
    <div className="absolute top-full left-0 right-0 z-50 bg-[#282E33] border-b border-white/10 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Formula Reference</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-4">
          {Object.entries(FORMULA_EXAMPLES).map(([name, details]) => (
            <div key={name} className="space-y-2 pb-4 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-primary">{name}</h4>
                <span className="text-xs text-muted-foreground">
                  {FORMULA_DESCRIPTIONS[name as keyof typeof FORMULA_DESCRIPTIONS]}
                </span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Syntax:</span>
                  <code className="ml-2 px-2 py-0.5 bg-background/50 rounded text-primary font-mono">
                    {details.syntax}
                  </code>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Example:</span>
                  <code className="ml-2 px-2 py-0.5 bg-background/50 rounded text-green-400 font-mono">
                    {details.example}
                  </code>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Result:</span>
                  <span className="ml-2 text-gray-300">{details.result}</span>
                </div>
                
                <p className="text-gray-400 mt-1 leading-relaxed">
                  {details.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
