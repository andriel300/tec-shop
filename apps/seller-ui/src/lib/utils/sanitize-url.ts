/**
 * Sanitizes a URL to prevent XSS attacks.
 * Blocks dangerous protocols like javascript: and vbscript:.
 * Allows http, https, blob, and data:image URLs.
 */
export const sanitizeUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  // Remove whitespace which might be used to bypass filters
  const trimmedUrl = url.trim();

  // We check the lowercased version for protocol matching
  const normalizedUrl = trimmedUrl.toLowerCase();

  // List of dangerous protocols to block
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:text/html'];

  // Check for dangerous protocols
  for (const protocol of dangerousProtocols) {
    if (normalizedUrl.startsWith(protocol)) {
      console.warn('Blocked potentially unsafe URL protocol', { url });
      return null;
    }
  }

  // If it looks like an absolute URL (contains a protocol separator),
  // ensure it is one of the explicitly allowed protocols.
  const isAbsolute = normalizedUrl.includes('://') || normalizedUrl.startsWith('blob:') || normalizedUrl.startsWith('data:');

  if (isAbsolute) {
    const safeProtocols = ['http://', 'https://', 'blob:', 'data:image/'];
    const isSafe = safeProtocols.some(protocol => normalizedUrl.startsWith(protocol));

    if (!isSafe) {
      console.warn('Blocked unknown URL protocol', { url });
      return null;
    }
  }

  // Relative paths are generally safe
  return trimmedUrl;
};
