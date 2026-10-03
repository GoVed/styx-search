import logger from '../utils/logger.js';

/**
 * Executes a search query against a SearXNG instance.
 * @param {string} baseUrl
 * @param {string} query
 * @param {object} options
 * @returns {Promise<Array<{ title: string, url: string, snippet: string, engine?: string }>>}
 */
export async function searchSearxng(baseUrl, query, options = {}) {
  const limit = options.limit || 5;
  const categories = options.categories || 'general';
  const timeRange = options.time_range;

  const url = new URL(`${baseUrl}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  if (categories) url.searchParams.set('categories', categories);
  if (timeRange) url.searchParams.set('time_range', timeRange);

  logger.debug({ url: url.toString() }, 'Querying SearXNG');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Syndae-Agent-OS/1.0 (Web Search Tool)'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`SearXNG returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];

    const mapped = rawResults.slice(0, limit).map(item => ({
      title: item.title || 'Untitled Result',
      url: item.url,
      snippet: (item.content || item.snippet || '').trim(),
      engine: item.engine || (Array.isArray(item.engines) ? item.engines.join(',') : 'searxng')
    }));

    return mapped;
  } catch (err) {
    logger.error({ err: err.message, query, baseUrl }, 'SearXNG search request failed');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default { searchSearxng };
