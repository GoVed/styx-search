import express from 'express';
import fs from 'node:fs';
import config from '../config.js';
import logger from '../utils/logger.js';
import { handleMcpRequest } from './server.js';
import { executeWebSearch } from '../providers/index.js';
import { readWebPage } from '../reader/extract.js';

/**
 * Creates and starts the Search Tool HTTP daemon.
 * @returns {import('http').Server}
 */
export function startHttpServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // 1. Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'styx-search',
      uptime: process.uptime()
    });
  });

  // 2. Status & Configuration
  app.get('/status', (req, res) => {
    res.json({
      service: 'styx-search',
      provider: config.provider,
      searxng_url: config.searxngUrl,
      port: config.port,
      status: 'ready'
    });
  });

  // 3. Instructions endpoint for Styx discovery & auto-ingestion
  app.get('/instructions', (req, res) => {
    try {
      if (fs.existsSync(config.instructionsPath)) {
        const instructions = fs.readFileSync(config.instructionsPath, 'utf-8');
        return res.json({
          success: true,
          name: 'search',
          title: 'Web Search & Internet Retrieval Integration',
          instructions
        });
      }
      res.status(404).json({ success: false, error: 'instructions.md not found' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. MCP JSON-RPC Endpoint
  app.post('/mcp', async (req, res) => {
    try {
      const response = await handleMcpRequest(req.body);
      if (response === null) {
        return res.status(204).end();
      }
      res.json(response);
    } catch (err) {
      logger.error({ err }, 'Error handling MCP request over HTTP');
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: { code: -32603, message: `Internal server error: ${err.message}` }
      });
    }
  });

  // 5. REST convenience endpoint for quick search
  app.get('/search', async (req, res) => {
    try {
      const query = req.query.q || req.query.query;
      if (!query) {
        return res.status(400).json({ success: false, error: 'Query parameter q is required' });
      }
      const limit = parseInt(req.query.limit || '5', 10);
      const results = await executeWebSearch(query, { limit, categories: req.query.categories });
      res.json({ success: true, count: results.length, results });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. REST convenience endpoint for reading page
  app.get('/read', async (req, res) => {
    try {
      const url = req.query.url;
      if (!url) {
        return res.status(400).json({ success: false, error: 'Query parameter url is required' });
      }
      const pageData = await readWebPage(url, { max_length: parseInt(req.query.max_length || '4000', 10) });
      res.json({ success: true, data: pageData });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  const server = app.listen(config.port, config.host, () => {
    logger.info({ port: config.port, host: config.host, provider: config.provider }, 'Styx Web Search MCP HTTP Server listening');
  });

  return server;
}

export default { startHttpServer };
