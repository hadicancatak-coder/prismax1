export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  backgroundColor?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: number;
  borderTop?: boolean;
  borderRight?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderColor?: string;
}

export interface MergedCell {
  startRow: number;
  startCol: number;
  rowSpan: number;
  colSpan: number;
}

export interface AdvancedCellData {
  value: string | number;
  formula?: string;
  calculatedValue?: number;
  style?: CellStyle;
  mergedWith?: MergedCell;
}

export interface AdvancedSpreadsheetData {
  [cellKey: string]: AdvancedCellData;
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  dataRange: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
  xAxisColumn?: number;
  yAxisColumns?: number[];
  colors?: string[];
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}
