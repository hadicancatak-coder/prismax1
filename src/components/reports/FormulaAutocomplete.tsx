import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { FORMULAS, FORMULA_TEMPLATES, FORMULA_DESCRIPTIONS, highlightFormula } from '@/lib/formulaSyntaxHighlighter';

interface FormulaAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onBlur?: () => void;
  className?: string;
}

export function FormulaAutocomplete({
  value,
  onChange,
  onCommit,
  onBlur,
  className,
}: FormulaAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Detect formula input and filter suggestions
  useEffect(() => {
    if (value.startsWith('=')) {
      const formulaName = value.slice(1).split('(')[0].toUpperCase();
      const matches = FORMULAS.filter(f => f.startsWith(formulaName));
      setFilteredSuggestions([...matches]);
      setShowSuggestions(matches.length > 0 && formulaName.length > 0 && !value.includes('('));
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [value]);

  // Insert formula template
  const insertFormula = (formulaName: string) => {
    onChange(FORMULA_TEMPLATES[formulaName]);
    setShowSuggestions(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Tab') {
        e.preventDefault();
        insertFormula(filteredSuggestions[selectedIndex]);
      } else if (e.key === 'Enter' && filteredSuggestions.length > 0) {
        e.preventDefault();
        insertFormula(filteredSuggestions[selectedIndex]);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onBlur?.();
    }
  };

  // Sync overlay scroll with input
  useEffect(() => {
    if (inputRef.current && overlayRef.current) {
      overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  }, [value]);

  const highlighted = value.startsWith('=') ? highlightFormula(value) : value;

  return (
    <div className="relative">
      {/* Syntax highlighting overlay */}
      {value.startsWith('=') && (
        <div
          ref={overlayRef}
          className="formula-syntax-overlay"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      )}
      
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        className={cn(
          "w-full h-full px-1.5 py-0.5 bg-background border-0 outline-none text-xs font-mono",
          value.startsWith('=') && "text-transparent caret-white",
          className
        )}
        autoFocus
      />

      {/* Autocomplete dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="formula-autocomplete-dropdown">
          {filteredSuggestions.map((formula, idx) => (
            <div
              key={formula}
              className={cn(
                'formula-suggestion-item',
                idx === selectedIndex && 'formula-suggestion-selected'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                insertFormula(formula);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span className="formula-suggestion-name">{formula}</span>
              <span className="formula-suggestion-description">
                {FORMULA_DESCRIPTIONS[formula]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
