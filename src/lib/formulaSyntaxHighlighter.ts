/**
 * Syntax highlighting for spreadsheet formulas
 */

export function highlightFormula(formula: string): string {
  if (!formula.startsWith('=')) return formula;
  
  let highlighted = formula;
  
  // Function names (SUM, AVERAGE, etc.)
  highlighted = highlighted.replace(
    /\b(SUM|AVERAGE|AVG|COUNT|MIN|MAX|IF|VLOOKUP)\b/g,
    '<span class="formula-function">$1</span>'
  );
  
  // Cell references (A1, B5, C10:D20)
  highlighted = highlighted.replace(
    /\b([A-Z]+[0-9]+(?::[A-Z]+[0-9]+)?)\b/g,
    '<span class="formula-cell-ref">$1</span>'
  );
  
  // Numbers
  highlighted = highlighted.replace(
    /\b(\d+(?:\.\d+)?)\b/g,
    '<span class="formula-number">$1</span>'
  );
  
  // String literals
  highlighted = highlighted.replace(
    /"([^"]*)"/g,
    '<span class="formula-string">"$1"</span>'
  );
  
  // Operators
  highlighted = highlighted.replace(
    /([+\-*/=<>])/g,
    '<span class="formula-operator">$1</span>'
  );
  
  // Parentheses and commas
  highlighted = highlighted.replace(
    /([(),])/g,
    '<span class="formula-delimiter">$1</span>'
  );
  
  return highlighted;
}

export const FORMULAS = [
  'SUM',
  'AVERAGE',
  'COUNT',
  'MIN',
  'MAX',
  'IF',
  'VLOOKUP',
  'AND',
  'OR',
  'HLOOKUP',
] as const;

export const FORMULA_TEMPLATES: Record<string, string> = {
  SUM: '=SUM(A1:A10)',
  AVERAGE: '=AVERAGE(A1:A10)',
  COUNT: '=COUNT(A1:A10)',
  MIN: '=MIN(A1:A10)',
  MAX: '=MAX(A1:A10)',
  IF: '=IF(A1>10, "Yes", "No")',
  VLOOKUP: '=VLOOKUP(A1, A1:B10, 2)',
  AND: '=AND(A1>10, B1<20)',
  OR: '=OR(A1>10, B1<20)',
  HLOOKUP: '=HLOOKUP(A1, A1:B10, 2)',
};

export const FORMULA_DESCRIPTIONS: Record<string, string> = {
  SUM: 'Adds all numbers in a range',
  AVERAGE: 'Calculates the average of numbers',
  COUNT: 'Counts the number of cells with values',
  MIN: 'Returns the minimum value',
  MAX: 'Returns the maximum value',
  IF: 'Returns one value if true, another if false',
  VLOOKUP: 'Looks up a value in a table',
  AND: 'Returns TRUE if all conditions are true',
  OR: 'Returns TRUE if any condition is true',
  HLOOKUP: 'Looks up a value horizontally in a table',
};
