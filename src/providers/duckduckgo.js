import logger from '../utils/logger.js';

/**
 * Executes a zero-config web search using DuckDuckGo public HTML/API endpoints.
 * @param {string} query
 * @param {object} options
 * @returns {Promise<Array<{ title: string, url: string, snippet: string, engine: string }>>}
 */
export async function searchDuckDuckGo(query, options = {}) {
  const limit = options.limit || 5;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  logger.debug({ query }, 'Querying DuckDuckGo fallback');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo returned HTTP ${response.status}`);
    }

    const html = await response.text();
    const results = [];

    // Parse DuckDuckGo HTML results
    const regex = /<a[^>]+class="result__url"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = regex.exec(html)) !== null && results.length < limit) {
      const rawUrl = match[1];
      let decodedUrl = rawUrl;
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        try {
          decodedUrl = decodeURIComponent(uddgMatch[1]);
        } catch {
          decodedUrl = rawUrl;
        }
      }

      const cleanSnippet = match[3].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
      const cleanTitle = match[2].replace(/<[^>]+>/g, '').trim() || decodedUrl;

      if (decodedUrl && cleanSnippet) {
        results.push({
          title: cleanTitle,
          url: decodedUrl,
          snippet: cleanSnippet,
          engine: 'duckduckgo'
        });
      }
    }

    return results;
  } catch (err) {
    logger.warn({ err: err.message, query }, 'DuckDuckGo search failed');
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export default { searchDuckDuckGo };
