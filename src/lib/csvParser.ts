export interface ParsedDataset {
  datasetName: string;
  detectedType: 'weekly_performance' | 'monthly_performance' | 'generic_kpi';
  granularity: 'weekly' | 'monthly' | 'custom';
  timeKey: string | null;
  primaryKpiFields: string[];
  dateRange: { start: Date | null; end: Date | null };
  normalizedRows: NormalizedRow[];
  columnDefinitions: ColumnDefinition[];
  parsingMetadata: {
    unpivotApplied: boolean;
    columnsNormalized: string[];
    unclassifiedMetrics: string[];
  };
}

export interface NormalizedRow {
  time_key: string | null;
  metric_name: string;
  metric_value: number | null;
  metric_unit: 'AED' | '%' | 'count' | 'text';
  raw_data: Record<string, any>;
}

export interface ColumnDefinition {
  name: string;
  type: 'number' | 'text' | 'date';
  format: string | null;
}

export async function parseCSV(file: File): Promise<ParsedDataset> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim() && !line.match(/^Total|^Difference/i));
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // 1. Parse headers and detect structure
  const headers = parseCSVLine(lines[0]).map(h => cleanHeader(h));
  const dataRows = lines.slice(1).map(row => {
    const values = parseCSVLine(row);
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
  
  // 2. Detect file type
  const detectedType = detectFileType(file.name, headers);
  const granularity = detectGranularity(headers);
  
  // 3. Identify key columns
  const timeKey = identifyTimeKey(headers);
  const metricColumns = identifyMetrics(headers);
  
  // 4. Normalize values
  const normalizedRows = normalizeData(dataRows, headers, timeKey, detectedType);
  
  // 5. Extract date range
  const dateRange = extractDateRange(normalizedRows);
  
  // 6. Create column definitions
  const columnDefinitions: ColumnDefinition[] = headers.map(header => ({
    name: header,
    type: inferColumnType(dataRows, header),
    format: detectFormat(dataRows, header)
  }));
  
  return {
    datasetName: file.name.replace('.csv', ''),
    detectedType,
    granularity,
    timeKey,
    primaryKpiFields: metricColumns,
    dateRange,
    normalizedRows,
    columnDefinitions,
    parsingMetadata: {
      unpivotApplied: detectedType === 'monthly_performance',
      columnsNormalized: metricColumns,
      unclassifiedMetrics: []
    }
  };
}

// Helper: Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Helper: Clean headers
function cleanHeader(header: string): string {
  return header.trim().replace(/^"|"$/g, '').replace(/\s+/g, ' ');
}

// Helper: Detect file type
function detectFileType(filename: string, headers: string[]): ParsedDataset['detectedType'] {
  const lowerFilename = filename.toLowerCase();
  const headerStr = headers.join(' ').toLowerCase();
  
  // Weekly dataset detection
  if (
    lowerFilename.includes('wow') || 
    lowerFilename.includes('week') ||
    headerStr.includes('week') ||
    headers.some(h => h.match(/week \d+/i))
  ) {
    return 'weekly_performance';
  }
  
  // Monthly dataset detection
  if (
    lowerFilename.includes('month') ||
    lowerFilename.includes('brief') ||
    headers.some(h => h.match(/january|february|march|april|may|june|july|august|september|october|november|december/i))
  ) {
    return 'monthly_performance';
  }
  
  return 'generic_kpi';
}

// Helper: Detect granularity
function detectGranularity(headers: string[]): ParsedDataset['granularity'] {
  const headerStr = headers.join(' ').toLowerCase();
  if (headerStr.includes('week')) return 'weekly';
  if (headerStr.match(/january|february|month/)) return 'monthly';
  return 'custom';
}

// Helper: Identify time key column
function identifyTimeKey(headers: string[]): string | null {
  const timePatterns = [
    /week/i,
    /date/i,
    /month/i,
    /period/i,
    /time/i
  ];
  
  for (const header of headers) {
    if (timePatterns.some(pattern => pattern.test(header))) {
      return header;
    }
  }
  
  return null;
}

// Helper: Identify metric columns
function identifyMetrics(headers: string[]): string[] {
  const metricPatterns = [
    /cost|spend|budget/i,
    /cpl|cpa|cpc|ctr/i,
    /leads?|conversions?/i,
    /clicks?/i,
    /impressions?/i,
    /qualified|approved/i,
    /revenue/i
  ];
  
  return headers.filter(header => 
    metricPatterns.some(pattern => pattern.test(header)) ||
    header.includes('$') ||
    header.includes('%')
  );
}

// Helper: Normalize data rows
function normalizeData(
  rows: Record<string, string>[],
  headers: string[],
  timeKey: string | null,
  type: ParsedDataset['detectedType']
): NormalizedRow[] {
  const normalized: NormalizedRow[] = [];
  
  if (type === 'monthly_performance') {
    // Unpivot: Convert columns (Jan, Feb, Mar) into rows
    const monthHeaders = headers.filter(h => h.match(/january|february|march|april|may|june|july|august|september|october|november|december/i));
    
    rows.forEach(row => {
      const metricName = row[headers[0]]; // First column is metric name
      if (!metricName || metricName.trim() === '') return;
      
      monthHeaders.forEach(month => {
        const rawValue = row[month];
        const { value, unit } = normalizeValue(rawValue);
        
        normalized.push({
          time_key: month,
          metric_name: metricName,
          metric_value: value,
          metric_unit: unit,
          raw_data: row
        });
      });
    });
  } else {
    // Standard row-based format
    rows.forEach(row => {
      headers.forEach(header => {
        if (header === timeKey) return; // Skip time column
        
        const rawValue = row[header];
        const { value, unit } = normalizeValue(rawValue);
        
        normalized.push({
          time_key: timeKey ? row[timeKey] : null,
          metric_name: header,
          metric_value: value,
          metric_unit: unit,
          raw_data: row
        });
      });
    });
  }
  
  return normalized.filter(row => row.metric_value !== null); // Remove invalid rows
}

// Helper: Normalize individual values
function normalizeValue(value: string): { value: number | null; unit: NormalizedRow['metric_unit'] } {
  if (!value || value.trim() === '' || value === '#DIV/0!') {
    return { value: null, unit: 'text' };
  }
  
  // Remove whitespace
  value = value.trim();
  
  // Detect percentage
  if (value.includes('%')) {
    const num = parseFloat(value.replace(/[%,\s]/g, ''));
    return { value: isNaN(num) ? null : num / 100, unit: '%' };
  }
  
  // Detect currency (AED)
  if (value.includes('$') || value.includes('AED')) {
    const num = parseFloat(value.replace(/[$,AED\s]/g, ''));
    return { value: isNaN(num) ? null : num, unit: 'AED' };
  }
  
  // Detect numbers with commas
  if (value.match(/^\d{1,3}(,\d{3})+(\.\d+)?$/)) {
    const num = parseFloat(value.replace(/,/g, ''));
    return { value: isNaN(num) ? null : num, unit: 'count' };
  }
  
  // Try parsing as number
  const num = parseFloat(value);
  if (!isNaN(num)) {
    return { value: num, unit: 'count' };
  }
  
  return { value: null, unit: 'text' };
}

// Helper: Extract date range
function extractDateRange(rows: NormalizedRow[]): { start: Date | null; end: Date | null } {
  const dates = rows
    .map(r => r.time_key)
    .filter(Boolean)
    .map(parseTimeKey)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  
  if (dates.length === 0) {
    return { start: null, end: null };
  }
  
  return {
    start: dates[0],
    end: dates[dates.length - 1]
  };
}

// Helper: Parse time keys
function parseTimeKey(timeKey: string): Date | null {
  // Try parsing "Week 42 (Oct 12 - Oct 18)"
  const weekMatch = timeKey.match(/Week \d+ \(([^)]+)\)/);
  if (weekMatch) {
    const dateStr = weekMatch[1].split(' - ')[0]; // Get start date
    const year = new Date().getFullYear();
    return new Date(dateStr + ' ' + year);
  }
  
  // Try parsing month names
  const monthMatch = timeKey.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
  if (monthMatch) {
    const year = new Date().getFullYear();
    return new Date(monthMatch[1] + ' 1, ' + year);
  }
  
  // Try parsing ISO dates
  const isoDate = new Date(timeKey);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  return null;
}

// Helper: Infer column type
function inferColumnType(rows: Record<string, string>[], header: string): 'number' | 'text' | 'date' {
  const sample = rows.slice(0, 10).map(r => r[header]).filter(Boolean);
  
  if (sample.length === 0) return 'text';
  
  const numericCount = sample.filter(v => !isNaN(parseFloat(v.replace(/[$,%,\s]/g, '')))).length;
  if (numericCount / sample.length > 0.8) return 'number';
  
  const dateCount = sample.filter(v => !isNaN(new Date(v).getTime())).length;
  if (dateCount / sample.length > 0.8) return 'date';
  
  return 'text';
}

// Helper: Detect format
function detectFormat(rows: Record<string, string>[], header: string): string | null {
  const sample = rows[0]?.[header];
  if (!sample) return null;
  
  if (sample.includes('%')) return 'percentage';
  if (sample.includes('$') || sample.includes('AED')) return 'currency';
  if (sample.match(/\d{1,3}(,\d{3})+/)) return 'number_with_commas';
  
  return null;
}
