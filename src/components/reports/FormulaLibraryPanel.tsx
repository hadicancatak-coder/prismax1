import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FORMULA_TEMPLATES, FORMULA_DESCRIPTIONS } from '@/lib/formulaSyntaxHighlighter';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FormulaLibraryPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onInsertFormula: (formula: string) => void;
}

const FORMULA_CATEGORIES = {
  'Math & Statistics': ['SUM', 'AVERAGE', 'COUNT', 'MIN', 'MAX'],
  'Logical': ['IF'],
  'Lookup': ['VLOOKUP'],
};

export function FormulaLibraryPanel({ isOpen, onToggle, onInsertFormula }: FormulaLibraryPanelProps) {
  const [search, setSearch] = useState('');

  const filteredCategories = Object.entries(FORMULA_CATEGORIES).reduce((acc, [category, formulas]) => {
    const filtered = formulas.filter(formula =>
      formula.toLowerCase().includes(search.toLowerCase()) ||
      FORMULA_DESCRIPTIONS[formula]?.toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div
      className={cn(
        "border-l border-border bg-card transition-all duration-300 flex flex-col",
        isOpen ? "w-72" : "w-0 overflow-hidden"
      )}
    >
      {isOpen && (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Formula Library</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={onToggle} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-4 py-3">
            <Input
              placeholder="Search formulas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 pb-4">
              <Accordion type="multiple" defaultValue={Object.keys(FORMULA_CATEGORIES)} className="w-full">
                {Object.entries(filteredCategories).map(([category, formulas]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-sm font-medium">
                      {category}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {formulas.map((formula) => (
                          <div
                            key={formula}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('formula', FORMULA_TEMPLATES[formula]);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            onClick={() => onInsertFormula(FORMULA_TEMPLATES[formula])}
                            className="px-3 py-2 bg-muted rounded-md cursor-move hover:bg-accent transition-colors group"
                          >
                            <div className="text-sm font-mono text-primary font-semibold">
                              {formula}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {FORMULA_DESCRIPTIONS[formula]}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground/70 mt-1">
                              {FORMULA_TEMPLATES[formula]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
