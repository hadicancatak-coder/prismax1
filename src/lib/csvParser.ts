export interface ParsedDataset {
  datasetName: string;
  detectedType: 'weekly_performance' | 'monthly_performance' | 'generic_kpi';
  granularity: 'weekly' | 'monthly' | 'custom';
  timeKey: string | null;
  primaryKpiFields: string[];
  dateRange: { start: Date | null; end: Date | null };
  normalizedRows: NormalizedRow[];
  columnDefinitions: ColumnDefinition[];
  hasDimensions: boolean;
  dimensionValues: string[];
  parsingMetadata: {
    unpivotApplied: boolean;
    columnsNormalized: string[];
    unclassifiedMetrics: string[];
  };
}

export interface NormalizedRow {
  time_key: string | null;
  time_key_parsed: Date | null;
  dimension: string | null;
  dimension_type: string | null;
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
  try {
    const text = await file.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('CSV file is empty');
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV file contains no valid data');
    }
    
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }
    
    // 1. Parse headers and detect structure
    const headers = parseCSVLine(lines[0]).map(h => cleanHeader(h));
    
    if (headers.length === 0) {
      throw new Error('CSV file has no headers');
    }
    
    // Parse rows with section header detection
    const { dataRows, dimensionValues } = parseRowsWithSections(lines.slice(1), headers);
    
    if (dataRows.length === 0) {
      throw new Error('CSV file has no data rows');
    }
    
    // 2. Detect file type
    const detectedType = detectFileType(file.name, headers);
    const granularity = detectGranularity(headers);
    
    // 3. Identify key columns
    const timeKey = identifyTimeKey(headers);
    const metricColumns = identifyMetrics(headers);
    
    // 4. Normalize values
    const normalizedRows = normalizeData(dataRows, headers, timeKey, detectedType);
    
    if (normalizedRows.length === 0) {
      throw new Error('Could not parse any valid data from CSV. Please check the file format.');
    }
    
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
      hasDimensions: dimensionValues.length > 0,
      dimensionValues,
      parsingMetadata: {
        unpivotApplied: detectedType === 'monthly_performance',
        columnsNormalized: metricColumns,
        unclassifiedMetrics: []
      }
    };
  } catch (error: any) {
    throw new Error(`CSV parsing error: ${error.message || 'Unknown error'}`);
  }
}

// Helper: Parse rows with section header detection
function parseRowsWithSections(
  lines: string[], 
  headers: string[]
): { dataRows: Array<Record<string, string> & { dimension?: string; dimension_type?: string }>; dimensionValues: string[] } {
  const dataRows: Array<Record<string, string> & { dimension?: string; dimension_type?: string }> = [];
  const dimensionValues: string[] = [];
  let currentDimension: string | null = null;
  
  for (const line of lines) {
    const values = parseCSVLine(line);
    
    // Check if this is a section header row
    const sectionHeader = isSectionHeaderRow(values, headers);
    
    if (sectionHeader) {
      currentDimension = sectionHeader;
      if (!dimensionValues.includes(sectionHeader)) {
        dimensionValues.push(sectionHeader);
      }
      continue; // Skip section header rows
    }
    
    // Create data row object
    const obj: Record<string, string> & { dimension?: string; dimension_type?: string } = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    
    // Add dimension info if we're in a section
    if (currentDimension) {
      obj.dimension = currentDimension;
      obj.dimension_type = detectDimensionType(currentDimension);
    }
    
    dataRows.push(obj);
  }
  
  return { dataRows, dimensionValues };
}

// Helper: Check if row is a section header
function isSectionHeaderRow(values: string[], headers: string[]): string | null {
  if (values.length === 0) return null;
  
  const firstValue = values[0]?.trim();
  if (!firstValue) return null;
  
  // Common section header patterns
  const sectionPatterns = [
    /^Total$/i,
    /^UAE$/i,
    /^KSA$/i,
    /^Jordan$/i,
    /^Egypt$/i,
    /^Saudi Arabia$/i,
    /^United Arab Emirates$/i,
    /^GCC$/i,
    /^MENA$/i,
    /^Overall$/i,
    /^Summary$/i
  ];
  
  // Check if first value matches a section pattern
  const isSection = sectionPatterns.some(pattern => pattern.test(firstValue));
  
  if (!isSection) return null;
  
  // Verify that most other cells are empty (section headers typically have only the first column filled)
  const nonEmptyCells = values.slice(1).filter(v => v && v.trim() !== '').length;
  const emptinessRatio = nonEmptyCells / (values.length - 1);
  
  if (emptinessRatio < 0.3) { // Less than 30% of cells are filled
    return firstValue;
  }
  
  return null;
}

// Helper: Detect dimension type from dimension name
function detectDimensionType(dimension: string): string {
  const dim = dimension.toLowerCase();
  
  // Country names
  const countries = ['uae', 'ksa', 'jordan', 'egypt', 'saudi', 'emirates'];
  if (countries.some(c => dim.includes(c))) {
    return 'country';
  }
  
  // Total/Overall
  if (dim.match(/total|overall|summary/)) {
    return 'total';
  }
  
  // Regional groupings
  if (dim.match(/gcc|mena|region/)) {
    return 'region';
  }
  
  return 'custom';
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
  rows: Array<Record<string, string> & { dimension?: string; dimension_type?: string }>,
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
          time_key_parsed: parseTimeKey(month),
          dimension: row.dimension || null,
          dimension_type: row.dimension_type || null,
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
        const timeValue = timeKey ? row[timeKey] : null;
        
        normalized.push({
          time_key: timeValue,
          time_key_parsed: parseTimeKey(timeValue),
          dimension: row.dimension || null,
          dimension_type: row.dimension_type || null,
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
