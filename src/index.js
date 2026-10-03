import { Command } from 'commander';
import { startHttpServer } from './mcp/http.js';
import { executeWebSearch } from './providers/index.js';
import { readWebPage } from './reader/extract.js';
import config from './config.js';

const program = new Command();

program
  .name('syndae-search')
  .description('Syndae Web Search & Content Reader MCP Tool')
  .version('1.0.0');

program
  .command('daemon')
  .description('Start the Web Search MCP HTTP daemon')
  .action(() => {
    startHttpServer();
  });

program
  .command('search <query>')
  .description('Execute a search query from CLI')
  .option('-l, --limit <number>', 'Number of results', '5')
  .option('-c, --category <string>', 'Category filter', 'general')
  .action(async (query, opts) => {
    try {
      const results = await executeWebSearch(query, {
        limit: parseInt(opts.limit, 10),
        categories: opts.category
      });
      console.log(JSON.stringify(results, null, 2));
    } catch (err) {
      console.error('Search failed:', err.message);
      process.exit(1);
    }
  });

program
  .command('read <url>')
  .description('Fetch and extract readable text from a webpage')
  .option('-m, --max-length <number>', 'Max characters', '4000')
  .action(async (url, opts) => {
    try {
      const data = await readWebPage(url, { max_length: parseInt(opts.maxLength, 10) });
      console.log(`Title: ${data.title}\nURL: ${data.url}\n\n${data.content}`);
    } catch (err) {
      console.error('Read failed:', err.message);
      process.exit(1);
    }
  });

// Default to daemon if run directly without arguments
if (process.argv.length <= 2) {
  startHttpServer();
} else {
  program.parse(process.argv);
}

export * from './providers/index.js';
export * from './reader/extract.js';
export * from './mcp/server.js';
