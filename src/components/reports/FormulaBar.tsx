import { Button } from '@/components/ui/button';
import { FunctionSquare, HelpCircle } from 'lucide-react';
import { FormulaAutocomplete } from './FormulaAutocomplete';
import { useState } from 'react';
import { FormulaHelpPanel } from './FormulaHelpPanel';

interface FormulaBarProps {
  selectedCell: string | null;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}

export function FormulaBar({ selectedCell, value, onChange, onCommit }: FormulaBarProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-[#282E33]">
        {/* Cell reference */}
        <div className="flex items-center gap-2 min-w-[80px]">
          <span className="text-xs font-mono text-gray-400">
            {selectedCell || 'No cell selected'}
          </span>
        </div>

        {/* fx button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => setShowHelp(!showHelp)}
        >
          <FunctionSquare className="h-3.5 w-3.5" />
        </Button>

        {/* Formula input */}
        {selectedCell && (
          <div className="flex-1 min-w-0">
            <FormulaAutocomplete
              value={value}
              onChange={onChange}
              onCommit={onCommit}
              className="h-7 px-2 text-sm"
            />
          </div>
        )}

        {/* Help button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => setShowHelp(!showHelp)}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Help panel */}
      {showHelp && <FormulaHelpPanel onClose={() => setShowHelp(false)} />}
    </>
  );
}
