/**
 * Google Ads Editor CSV Mapper
 * Converts between our ad format and Google Ads Editor CSV format
 */

export interface GoogleEditorRow {
  'Campaign': string;
  'Ad group': string;
  'Ad type': string;
  'Headline 1': string;
  'Headline 2': string;
  'Headline 3': string;
  'Headline 4'?: string;
  'Headline 5'?: string;
  'Headline 6'?: string;
  'Headline 7'?: string;
  'Headline 8'?: string;
  'Headline 9'?: string;
  'Headline 10'?: string;
  'Headline 11'?: string;
  'Headline 12'?: string;
  'Headline 13'?: string;
  'Headline 14'?: string;
  'Headline 15'?: string;
  'Description 1': string;
  'Description 2': string;
  'Description 3'?: string;
  'Description 4'?: string;
  'Final URL': string;
  'Path 1'?: string;
  'Path 2'?: string;
  'Business name'?: string;
  'Long headline'?: string;
  'Status': string;
}

export function adToGoogleEditorRow(ad: any): GoogleEditorRow {
  const row: any = {
    'Campaign': ad.campaign_name || 'Unnamed Campaign',
    'Ad group': ad.ad_group_name || 'Unnamed Ad Group',
    'Ad type': 'Responsive search ad',
    'Final URL': ad.landing_page || '',
    'Status': ad.approval_status === 'approved' ? 'Enabled' : 'Paused',
  };

  // Add headlines (max 15)
  const headlines = ad.headlines || [];
  headlines.forEach((h: any, i: number) => {
    if (i < 15) {
      row[`Headline ${i + 1}`] = h.text || h;
    }
  });

  // Add descriptions (max 4)
  const descriptions = ad.descriptions || [];
  descriptions.forEach((d: any, i: number) => {
    if (i < 4) {
      row[`Description ${i + 1}`] = d.text || d;
    }
  });

  // Add optional fields
  if (ad.business_name) {
    row['Business name'] = ad.business_name;
  }
  if (ad.long_headline) {
    row['Long headline'] = ad.long_headline;
  }

  return row as GoogleEditorRow;
}

export function googleEditorRowToAd(row: GoogleEditorRow): any {
  const headlines = [];
  const descriptions = [];

  // Extract headlines
  for (let i = 1; i <= 15; i++) {
    const key = `Headline ${i}` as keyof GoogleEditorRow;
    if (row[key]) {
      headlines.push({ text: row[key], pinned: false });
    }
  }

  // Extract descriptions
  for (let i = 1; i <= 4; i++) {
    const key = `Description ${i}` as keyof GoogleEditorRow;
    if (row[key]) {
      descriptions.push({ text: row[key], pinned: false });
    }
  }

  return {
    campaign_name: row['Campaign'],
    ad_group_name: row['Ad group'],
    ad_type: 'search',
    headlines,
    descriptions,
    landing_page: row['Final URL'],
    business_name: row['Business name'] || '',
    long_headline: row['Long headline'] || '',
    approval_status: row['Status'] === 'Enabled' ? 'approved' : 'pending',
    sitelinks: [],
    callouts: [],
    short_headlines: [],
  };
}

export function convertToCSV(rows: GoogleEditorRow[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header as keyof GoogleEditorRow] || '';
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

export function parseCSV(csv: string): GoogleEditorRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: GoogleEditorRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row as GoogleEditorRow);
  }

  return rows;
}
