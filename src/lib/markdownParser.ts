export interface ParsedSegment {
  type: 'text' | 'link';
  content: string;
  url?: string;
}

/**
 * Parse markdown links and bare URLs in text
 * Supports: [text](url) and bare https://... URLs
 */
export function parseMarkdownLinks(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  
  // Combined regex for markdown links [text](url) and bare URLs
  const combinedRegex = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }

    // Check if it's a markdown link or bare URL
    if (match[1] && match[2]) {
      // Markdown link [text](url)
      segments.push({
        type: 'link',
        content: match[1],
        url: match[2],
      });
    } else if (match[3]) {
      // Bare URL
      segments.push({
        type: 'link',
        content: match[3],
        url: match[3],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content }];
}

/**
 * Insert a markdown link at the specified position
 */
export function insertMarkdownLink(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  url: string
): string {
  const selectedText = content.slice(selectionStart, selectionEnd);
  const linkText = selectedText || 'link';
  const markdownLink = `[${linkText}](${url})`;
  
  return (
    content.slice(0, selectionStart) +
    markdownLink +
    content.slice(selectionEnd)
  );
}

/**
 * Remove markdown link syntax, keeping only the text
 */
export function removeMarkdownLink(content: string, linkIndex: number): string {
  const segments = parseMarkdownLinks(content);
  let result = '';
  let currentLinkIndex = 0;

  for (const segment of segments) {
    if (segment.type === 'link') {
      if (currentLinkIndex === linkIndex) {
        // Remove link, keep text
        result += segment.content;
      } else {
        // Keep link as-is
        if (segment.content === segment.url) {
          result += segment.url;
        } else {
          result += `[${segment.content}](${segment.url})`;
        }
      }
      currentLinkIndex++;
    } else {
      result += segment.content;
    }
  }

  return result;
}

/**
 * Update a specific link's URL or text
 */
export function updateMarkdownLink(
  content: string,
  linkIndex: number,
  newUrl?: string,
  newText?: string
): string {
  const segments = parseMarkdownLinks(content);
  let result = '';
  let currentLinkIndex = 0;

  for (const segment of segments) {
    if (segment.type === 'link') {
      if (currentLinkIndex === linkIndex) {
        const url = newUrl || segment.url || '';
        const text = newText || segment.content;
        result += `[${text}](${url})`;
      } else {
        // Keep link as-is
        if (segment.content === segment.url) {
          result += segment.url;
        } else {
          result += `[${segment.content}](${segment.url})`;
        }
      }
      currentLinkIndex++;
    } else {
      result += segment.content;
    }
  }

  return result;
}
