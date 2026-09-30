import logger from '../utils/logger.js';

/**
 * Fetches a webpage URL and extracts clean readable text content.
 * @param {string} urlString
 * @param {object} options
 * @returns {Promise<{ url: string, title: string, content: string, byte_length: number }>}
 */
export async function readWebPage(urlString, options = {}) {
  const maxLength = options.max_length || 4000;

  if (!urlString || typeof urlString !== 'string') {
    throw new Error('Valid URL string is required');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only http and https protocols are supported');
    }
  } catch (err) {
    throw new Error(`Invalid URL: ${err.message}`);
  }

  logger.debug({ url: parsedUrl.toString() }, 'Fetching webpage content');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,text/plain'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Webpage fetch returned HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : parsedUrl.hostname;

    // Clean HTML: Remove scripts, styles, svgs, comments, nav, footer
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');

    // Replace headers and block elements with markdown breaks
    cleaned = cleaned
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n\n### $1\n')
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n* $1')
      .replace(/<br\s*[\/]?>/gi, '\n');

    // Strip remaining tags
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');

    // Normalize whitespace
    cleaned = cleaned
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();

    const truncated = cleaned.length > maxLength
      ? `${cleaned.substring(0, maxLength)}\n\n... [Content truncated at ${maxLength} characters]`
      : cleaned;

    return {
      url: parsedUrl.toString(),
      title,
      content: truncated,
      byte_length: Buffer.byteLength(truncated, 'utf-8')
    };
  } catch (err) {
    logger.error({ err: err.message, url: parsedUrl.toString() }, 'Failed to read webpage');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default { readWebPage };
