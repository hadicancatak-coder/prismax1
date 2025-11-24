/**
 * Strip HTML tags from a string and return plain text
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  // Create a temporary div to leverage browser's HTML parsing
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Get text content and clean up whitespace
  return temp.textContent || temp.innerText || '';
}

/**
 * Strip HTML and limit to specified character length
 */
export function stripHtmlAndLimit(html: string, maxLength: number = 100): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
