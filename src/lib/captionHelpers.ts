import { stripHtml } from "./stripHtml";

/**
 * Consistent content parsing for Caption Library
 * Handles both legacy (string) and new (JSON object) formats
 */
export function getContentForLanguage(content: unknown, lang: "en" | "ar"): string {
  if (!content) return "";

  // Handle string content (legacy format or JSON string)
  if (typeof content === "string") {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === "object" && parsed !== null) {
        return String(parsed[lang] || (lang === "en" ? parsed.text || "" : ""));
      }
    } catch {
      // Not JSON - plain string, treat as EN content
      return lang === "en" ? content : "";
    }
  }

  // Handle object content
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    if (obj[lang]) return String(obj[lang]);
    if (lang === "en" && obj.text) return String(obj.text);
  }

  return "";
}

/**
 * Get content stripped of HTML tags for display
 */
export function getContentForDisplay(content: unknown, lang: "en" | "ar"): string {
  const raw = getContentForLanguage(content, lang);
  return stripHtml(raw);
}

/**
 * Get content for copying (strips HTML)
 */
export function getContentForCopy(content: unknown, lang: "en" | "ar"): string {
  const raw = getContentForLanguage(content, lang);
  return stripHtml(raw);
}

/**
 * Parse stored content into {en, ar} object for editing
 */
export function parseContentForEditing(content: unknown): { en: string; ar: string } {
  if (!content) return { en: "", ar: "" };

  // Handle string content
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === "object" && parsed !== null) {
        return {
          en: String(parsed.en || parsed.text || ""),
          ar: String(parsed.ar || ""),
        };
      }
    } catch {
      // Plain string - treat as EN content
      return { en: content, ar: "" };
    }
  }

  // Handle object content
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    return {
      en: String(obj.en || obj.text || ""),
      ar: String(obj.ar || ""),
    };
  }

  return { en: "", ar: "" };
}

/**
 * Serialize content for database storage
 */
export function serializeContent(content: { en: string; ar: string }): { en: string; ar: string } {
  return {
    en: content.en || "",
    ar: content.ar || "",
  };
}
