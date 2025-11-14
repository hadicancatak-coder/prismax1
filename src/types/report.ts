import type { SpreadsheetData } from "@/lib/formulaParser";
import type { AdvancedSpreadsheetData, ChartConfig } from "./spreadsheet";

export interface ReportDocument {
  id: string;
  name: string;
  elements: ReportElement[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportElement {
  id: string;
  type: 'table' | 'text' | 'chart' | 'image';
  position: number;
  config: {
    width?: string;
    height?: number;
  };
  data: TableElementData | TextElementData | ChartElementData | ImageElementData;
}

export interface TableElementData {
  rows: number;
  cols: number;
  cells: SpreadsheetData | AdvancedSpreadsheetData;
  title?: string;
  charts?: ChartConfig[];
  useAdvanced?: boolean;
}

export interface TextElementData {
  content: string;
}

export interface ChartElementData {
  chartType: 'line' | 'bar' | 'area';
  sourceTableId?: string;
  dataRange?: { start: string; end: string };
  xAxis: string;
  yAxis: string[];
  title?: string;
  colors?: string[];
  height?: number;
}

export interface ImageElementData {
  url: string;
  alt?: string;
  caption?: string;
}
