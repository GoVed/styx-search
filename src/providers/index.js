import config from '../config.js';
import logger from '../utils/logger.js';
import { searchSearxng } from './searxng.js';
import { searchDuckDuckGo } from './duckduckgo.js';

/**
 * Searches the web using the configured primary provider with automatic resilient fallback.
 * @param {string} query
 * @param {object} options
 * @returns {Promise<Array<{ title: string, url: string, snippet: string, engine?: string }>>}
 */
export async function executeWebSearch(query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Search query string is required');
  }

  const cleanQuery = query.trim();
  const provider = options.provider || config.provider;

  if (provider === 'searxng') {
    try {
      const results = await searchSearxng(config.searxngUrl, cleanQuery, options);
      if (results && results.length > 0) {
        return results;
      }
      logger.info({ cleanQuery }, 'SearXNG returned 0 results, attempting fallback');
    } catch (err) {
      logger.warn({ err: err.message, cleanQuery }, 'SearXNG search error, falling back to DuckDuckGo');
    }
  }

  // Fallback to DuckDuckGo
  return searchDuckDuckGo(cleanQuery, options);
}

export default { executeWebSearch };
