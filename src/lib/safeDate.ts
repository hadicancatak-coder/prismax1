/**
 * Safe date parsing utilities to prevent "Invalid time value" errors
 */

/**
 * Safely parse a date string, returning null if invalid
 */
export function safeParseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

/**
 * Safely format a date, returning fallback if invalid
 */
export function safeFormatDate(
  dateString: string | null | undefined,
  formatFn: (date: Date) => string,
  fallback: string = ''
): string {
  const date = safeParseDate(dateString);
  if (!date) return fallback;
  
  try {
    return formatFn(date);
  } catch {
    return fallback;
  }
}

/**
 * Check if a date string is valid
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  return safeParseDate(dateString) !== null;
}

/**
 * Safely compare dates, treating invalid dates as very old
 */
export function safeDateCompare(
  dateA: string | null | undefined,
  dateB: string | null | undefined
): number {
  const a = safeParseDate(dateA)?.getTime() ?? 0;
  const b = safeParseDate(dateB)?.getTime() ?? 0;
  return a - b;
}
