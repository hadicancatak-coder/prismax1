/**
 * Formula Parser for Spreadsheet
 * Supports: SUM, AVG, MIN, MAX, COUNT, basic math operations
 * Cell references: A1, B2, ranges: A1:A5
 */

export interface CellData {
  value: string;
  formula?: string;
  calculated?: number;
}

export interface SpreadsheetData {
  [key: string]: CellData;
}

// Convert column letter to index (A=0, B=1, Z=25, AA=26, etc.)
export function columnToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return index - 1;
}

// Convert index to column letter (0=A, 1=B, 25=Z, 26=AA, etc.)
export function indexToColumn(index: number): string {
  let col = '';
  let num = index + 1;
  while (num > 0) {
    const rem = (num - 1) % 26;
    col = String.fromCharCode('A'.charCodeAt(0) + rem) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
}

// Parse cell reference like "A1" to { col: 0, row: 0 }
export function parseCellRef(ref: string): { col: number; row: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return {
    col: columnToIndex(match[1]),
    row: parseInt(match[2]) - 1,
  };
}

// Get cell key from col/row indices
export function getCellKey(col: number, row: number): string {
  return `${indexToColumn(col)}${row + 1}`;
}

// Parse range like "A1:A5" to array of cell refs
export function parseRange(range: string): string[] {
  const [start, end] = range.split(':');
  const startCell = parseCellRef(start);
  const endCell = parseCellRef(end);
  
  if (!startCell || !endCell) return [];
  
  const cells: string[] = [];
  
  for (let row = startCell.row; row <= endCell.row; row++) {
    for (let col = startCell.col; col <= endCell.col; col++) {
      cells.push(getCellKey(col, row));
    }
  }
  
  return cells;
}

// Get numeric value from cell
function getCellValue(cellKey: string, data: SpreadsheetData): number {
  const cell = data[cellKey];
  if (!cell) return 0;
  
  if (cell.calculated !== undefined) {
    return cell.calculated;
  }
  
  const num = parseFloat(cell.value);
  return isNaN(num) ? 0 : num;
}

// Get array of values from cell references
function getValues(refs: string[], data: SpreadsheetData): number[] {
  return refs.map(ref => getCellValue(ref, data));
}

// Evaluate a condition (for IF function)
function evaluateCondition(condition: string, data: SpreadsheetData): boolean {
  // Replace cell refs with values
  const expr = replaceCellRefs(condition, data);
  
  // Parse comparison operators
  if (expr.includes('>=')) {
    const [left, right] = expr.split('>=').map(v => parseFloat(v.trim()));
    return left >= right;
  } else if (expr.includes('<=')) {
    const [left, right] = expr.split('<=').map(v => parseFloat(v.trim()));
    return left <= right;
  } else if (expr.includes('>')) {
    const [left, right] = expr.split('>').map(v => parseFloat(v.trim()));
    return left > right;
  } else if (expr.includes('<')) {
    const [left, right] = expr.split('<').map(v => parseFloat(v.trim()));
    return left < right;
  } else if (expr.includes('=')) {
    const [left, right] = expr.split('=').map(v => v.trim());
    return left === right;
  }
  
  return false;
}

// Perform VLOOKUP
function performVlookup(lookupValue: string, tableRange: string, colIndex: number, data: SpreadsheetData): number {
  const cells = parseRange(tableRange);
  const lookupVal = replaceCellRefs(lookupValue, data);
  
  // Group cells by rows
  const table: string[][] = [];
  let currentRow: string[] = [];
  let lastRow = -1;
  
  cells.forEach(cellKey => {
    const parsed = parseCellRef(cellKey);
    if (!parsed) return;
    
    if (lastRow !== -1 && parsed.row !== lastRow) {
      table.push(currentRow);
      currentRow = [];
    }
    
    currentRow.push(cellKey);
    lastRow = parsed.row;
  });
  
  if (currentRow.length > 0) table.push(currentRow);
  
  // Search for lookup value in first column
  for (const row of table) {
    if (row.length < colIndex) continue;
    
    const firstCell = getCellValue(row[0], data).toString();
    if (firstCell === lookupVal) {
      return getCellValue(row[colIndex - 1], data);
    }
  }
  
  return 0;
}

// Evaluate formula functions
function evaluateFunction(funcName: string, args: string, data: SpreadsheetData): number {
  const argRefs: string[] = [];
  
  // Handle IF and VLOOKUP separately (they have special argument parsing)
  if (funcName.toUpperCase() === 'IF') {
    // IF(condition, trueValue, falseValue)
    // Split by commas but respect quoted strings
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let parenDepth = 0;
    
    for (let i = 0; i < args.length; i++) {
      const char = args[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === '(' && !inQuotes) {
        parenDepth++;
        current += char;
      } else if (char === ')' && !inQuotes) {
        parenDepth--;
        current += char;
      } else if (char === ',' && !inQuotes && parenDepth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) parts.push(current.trim());
    
    if (parts.length !== 3) return 0;
    
    const [condition, trueVal, falseVal] = parts;
    const conditionResult = evaluateCondition(condition, data);
    
    // Handle string values (remove quotes)
    const getTrueValue = () => {
      if (trueVal.startsWith('"') && trueVal.endsWith('"')) {
        return 1; // Convert string to 1 for display
      }
      return parseFloat(replaceCellRefs(trueVal, data)) || 0;
    };
    
    const getFalseValue = () => {
      if (falseVal.startsWith('"') && falseVal.endsWith('"')) {
        return 0; // Convert string to 0 for display
      }
      return parseFloat(replaceCellRefs(falseVal, data)) || 0;
    };
    
    return conditionResult ? getTrueValue() : getFalseValue();
  }
  
  if (funcName.toUpperCase() === 'VLOOKUP') {
    // VLOOKUP(lookupValue, tableRange, colIndex)
    const parts = args.split(',').map(a => a.trim());
    if (parts.length < 3) return 0;
    
    const [lookupVal, tableRange, colIdx] = parts;
    return performVlookup(lookupVal, tableRange, parseInt(colIdx), data);
  }
  
  // Parse arguments (can be ranges or individual cells)
  const argParts = args.split(',').map(a => a.trim());
  
  for (const arg of argParts) {
    if (arg.includes(':')) {
      // It's a range
      argRefs.push(...parseRange(arg));
    } else {
      // Individual cell
      argRefs.push(arg);
    }
  }
  
  const values = getValues(argRefs, data);
  
  switch (funcName.toUpperCase()) {
    case 'SUM':
      return values.reduce((sum, val) => sum + val, 0);
    
    case 'AVG':
    case 'AVERAGE':
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    
    case 'MIN':
      return values.length > 0 ? Math.min(...values) : 0;
    
    case 'MAX':
      return values.length > 0 ? Math.max(...values) : 0;
    
    case 'COUNT':
      return values.length;
    
    default:
      return 0;
  }
}

// Replace cell references in expression with their values
function replaceCellRefs(expr: string, data: SpreadsheetData): string {
  return expr.replace(/[A-Z]+\d+/g, (match) => {
    const value = getCellValue(match, data);
    return value.toString();
  });
}

// Safe mathematical expression evaluator using AST-based whitelist approach
function evaluateExpression(expr: string): number {
  try {
    // Remove spaces
    expr = expr.replace(/\s/g, '');
    
    // Tokenize the expression
    const tokens = expr.match(/(\d+\.?\d*|[+\-*/()%])/g);
    if (!tokens) return 0;
    
    // Validate tokens - only allow numbers and safe operators
    const validTokens = /^[\d+\-*/.()%\s]+$/;
    if (!validTokens.test(expr)) return 0;
    
    // Parse and evaluate using a simple recursive descent parser
    let pos = 0;
    
    const parseNumber = (): number => {
      const token = tokens[pos++];
      return parseFloat(token);
    };
    
    const parseFactor = (): number => {
      if (tokens[pos] === '(') {
        pos++; // skip '('
        const result = parseExpression();
        pos++; // skip ')'
        return result;
      }
      return parseNumber();
    };
    
    const parseTerm = (): number => {
      let result = parseFactor();
      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/' || tokens[pos] === '%')) {
        const op = tokens[pos++];
        const right = parseFactor();
        if (op === '*') result *= right;
        else if (op === '/') result = right !== 0 ? result / right : 0;
        else if (op === '%') result = right !== 0 ? result % right : 0;
      }
      return result;
    };
    
    const parseExpression = (): number => {
      let result = parseTerm();
      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos++];
        const right = parseTerm();
        if (op === '+') result += right;
        else if (op === '-') result -= right;
      }
      return result;
    };
    
    const result = parseExpression();
    return typeof result === 'number' && !isNaN(result) ? result : 0;
  } catch {
    return 0;
  }
}

/**
 * Parse and evaluate a formula
 * @param formula - The formula string (without leading =)
 * @param data - The spreadsheet data
 * @returns Calculated result
 */
export function evaluateFormula(formula: string, data: SpreadsheetData): number {
  // Remove leading/trailing whitespace
  formula = formula.trim();
  
  // Check for function calls like SUM(A1:A5)
  const funcMatch = formula.match(/^([A-Z]+)\((.*)\)$/);
  
  if (funcMatch) {
    const [, funcName, args] = funcMatch;
    return evaluateFunction(funcName, args, data);
  }
  
  // Otherwise treat as mathematical expression with cell references
  const expr = replaceCellRefs(formula, data);
  return evaluateExpression(expr);
}

/**
 * Detect if a value is a formula
 */
export function isFormula(value: string): boolean {
  return typeof value === 'string' && value.startsWith('=');
}

/**
 * Recalculate all cells with formulas
 */
export function recalculateAll(data: SpreadsheetData): SpreadsheetData {
  const newData: SpreadsheetData = {};
  
  // First pass: copy all non-formula cells
  Object.keys(data).forEach(key => {
    const cell = data[key];
    if (cell.formula) {
      newData[key] = { ...cell, calculated: 0 };
    } else {
      newData[key] = { ...cell };
    }
  });
  
  // Second pass: calculate formulas
  Object.keys(data).forEach(key => {
    const cell = data[key];
    if (cell.formula) {
      const formula = cell.formula.substring(1); // Remove leading =
      newData[key].calculated = evaluateFormula(formula, newData);
    }
  });
  
  return newData;
}
