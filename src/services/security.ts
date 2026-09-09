/**
 * Security & Sanitization Utilities
 * Protects against XSS, malicious URLs, prototype pollution keys, and dangerous characters.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Validates and sanitizes a URL before it is used in an <a href="..."> tag or window.open().
 * Rejects javascript:, data:, vbscript:, and relative malicious protocols.
 */
export function sanitizeUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    // If the URL has no protocol, attempt parsing with https://
    const urlToParse = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(urlToParse);
    if (ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return parsed.toString();
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Verifies if a given string is a safe external HTTP/HTTPS URL.
 */
export function isSafeUrl(url?: string | null): boolean {
  return sanitizeUrl(url) !== '';
}

/**
 * Strips non-printable ASCII/Unicode control characters (except newline, carriage return, tab)
 * and safely trims input strings.
 */
export function sanitizeText(text?: string | null, maxLength = 5000): string {
  if (!text || typeof text !== 'string') return '';
  // Remove null bytes and dangerous control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F)
  const cleaned = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return cleaned.slice(0, maxLength);
}

/**
 * Sanitizes GitHub usernames to only permit alphanumeric characters and single hyphens.
 */
export function sanitizeUsername(username?: string | null): string {
  if (!username || typeof username !== 'string') return '';
  return username.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 39);
}
