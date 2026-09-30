/**
 * MCP tool catalog definitions for Web Search tool (2024-11-05 spec).
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'web_search',
    description: 'Execute an online web search query to retrieve relevant websites, live information, articles, documentation, or news.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms or targeted keywords (e.g., "latest rust release notes", "react 19 changelog")'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of search results to return (default: 5, max: 20)'
        },
        categories: {
          type: 'string',
          description: 'Filter category: "general", "news", "science", "it" (default: "general")'
        },
        time_range: {
          type: 'string',
          description: 'Optional time filter: "day", "week", "month", "year"'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'read_web_page',
    description: 'Fetch the text content of a webpage URL, extracting clean, readable text and markdown.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Full HTTP/HTTPS URL of the webpage to read'
        },
        max_length: {
          type: 'number',
          description: 'Maximum character length of content to extract (default: 4000)'
        }
      },
      required: ['url']
    }
  }
];

export default { TOOL_DEFINITIONS };
