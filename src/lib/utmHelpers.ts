/**
 * Calculate UTM medium based on platform name using GA4 standards
 */
export const calculateUtmMedium = (platform: string): string => {
  const p = platform.toLowerCase().trim();
  
  if (/^(search|google|bing)$/.test(p)) return 'paid_search';
  if (/^(pmax)$/.test(p)) return 'cross-network';
  if (/^(youtube)$/.test(p)) return 'paid_video';
  if (/^(whatsapp|telegram)$/.test(p)) return 'messaging';
  if (/^(dgen)$/.test(p)) return 'display';
  if (/^(display|discovery)$/.test(p)) return 'display';
  if (/^(facebook|instagram|fb|ig|snap|tiktok|reddit|x|linkedin)$/.test(p)) return 'paid_social';
  
  return 'referral';
};

/**
 * Generate UTM campaign name in format: {campaign}_{language}_{monthyear}
 * Example: gold_en_oct2025
 */
export const generateUtmCampaign = (
  campaignName: string,
  language: string,
  date: Date = new Date()
): string => {
  const campaign = campaignName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const lang = language.toLowerCase();
  const monthYear = formatMonthYear(date);
  
  return `${campaign}_${lang}_${monthYear}`;
};

/**
 * Format date as MonthYear (e.g., "oct2025")
 */
export const formatMonthYear = (date: Date = new Date()): string => {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${month}${year}`;
};

/**
 * Format date as readable MonthYear (e.g., "Oct2025")
 */
export const formatMonthYearReadable = (date: Date = new Date()): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${month}${year}`;
};

/**
 * Build complete UTM URL from parameters
 */
export const buildUtmUrl = (params: {
  baseUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string;
  utmTerm?: string;
  customParams?: Record<string, string>;
}): string => {
  try {
    const url = new URL(params.baseUrl);
    
    url.searchParams.set('utm_source', params.utmSource.toLowerCase());
    url.searchParams.set('utm_medium', params.utmMedium.toLowerCase());
    url.searchParams.set('utm_campaign', params.utmCampaign.toLowerCase());
    
    if (params.utmContent) {
      url.searchParams.set('utm_content', params.utmContent.toLowerCase());
    }
    
    if (params.utmTerm) {
      url.searchParams.set('utm_term', params.utmTerm.toLowerCase());
    }
    
    if (params.customParams) {
      Object.entries(params.customParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    return url.toString();
  } catch (error) {
    return params.baseUrl;
  }
};
