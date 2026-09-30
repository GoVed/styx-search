import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  env: process.env.NODE_ENV || 'production',
  port: parseInt(process.env.HTTP_PORT || '8766', 10),
  host: process.env.HTTP_HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  provider: process.env.SEARCH_PROVIDER || 'searxng',
  searxngUrl: (process.env.SEARXNG_URL || 'http://localhost:8888').replace(/\/+$/, ''),
  instructionsPath: path.resolve(__dirname, '../instructions.md'),
  manifestPath: path.resolve(__dirname, '../manifest.json')
};

export default config;
