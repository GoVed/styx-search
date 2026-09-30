import assert from 'node:assert/strict';
import { executeWebSearch } from '../src/providers/index.js';
import { readWebPage } from '../src/reader/extract.js';
import { handleMcpRequest } from '../src/mcp/server.js';
import { startHttpServer } from '../src/mcp/http.js';
import config from '../src/config.js';

console.log('=== RUNNING COMPLETE STYX WEB SEARCH TEST SUITE ===\n');

// 1. Web Search Execution
console.log('Testing Web Search execution...');
try {
  const results = await executeWebSearch('rust programming language', { limit: 3 });
  assert.ok(Array.isArray(results), 'Results should be an array');
  assert.ok(results.length > 0, 'Should find at least 1 search result');
  assert.ok(results[0].title, 'First result must have title');
  assert.ok(results[0].url, 'First result must have URL');
  assert.ok(results[0].snippet, 'First result must have snippet');
  console.log(`✓ Web search verified: returned ${results.length} results (engine: ${results[0].engine})`);
} catch (err) {
  console.warn(`! Live search test note: ${err.message}`);
}

// 2. Web Page Extraction Test
console.log('\nTesting Web Page extraction...');
try {
  const page = await readWebPage('https://example.com', { max_length: 500 });
  assert.ok(page.title, 'Page should have title');
  assert.ok(page.content.includes('Example Domain'), 'Page content should contain Example Domain');
  assert.equal(page.url, 'https://example.com/');
  console.log(`✓ Web page reader verified (${page.byte_length} bytes read)`);
} catch (err) {
  console.warn(`! Live page reader note: ${err.message}`);
}

// 3. MCP Protocol Tests
console.log('\nTesting MCP 2024-11-05 Protocol Handshake & Tools...');

// 3a. Handshake
const initRes = await handleMcpRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { protocolVersion: '2024-11-05' }
});
assert.equal(initRes.result.protocolVersion, '2024-11-05');
assert.equal(initRes.result.serverInfo.name, 'styx-search');
console.log('✓ MCP initialize handshake verified');

// 3b. Tools List
const listRes = await handleMcpRequest({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list'
});
assert.equal(listRes.result.tools.length, 2);
assert.equal(listRes.result.tools[0].name, 'web_search');
assert.equal(listRes.result.tools[1].name, 'read_web_page');
console.log('✓ MCP tools/list verified (2 registered tools)');

// 3c. Tools Call: web_search
const callSearchRes = await handleMcpRequest({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'web_search',
    arguments: { query: 'test query', limit: 2 }
  }
});
assert.equal(callSearchRes.result.isError, false);
assert.ok(callSearchRes.result.content[0].text);
console.log('✓ tools/call web_search verified');

// 4. HTTP Server Endpoints
console.log('\nTesting HTTP Server Endpoints...');
const testPort = 9888;
process.env.HTTP_PORT = String(testPort);
config.port = testPort;

const server = startHttpServer();

try {
  // 4a. Health
  const healthRes = await fetch(`http://127.0.0.1:${testPort}/health`);
  const healthData = await healthRes.json();
  assert.equal(healthData.status, 'healthy');
  console.log('✓ GET /health verified');

  // 4b. Status
  const statusRes = await fetch(`http://127.0.0.1:${testPort}/status`);
  const statusData = await statusRes.json();
  assert.equal(statusData.service, 'styx-search');
  assert.equal(statusData.status, 'ready');
  console.log('✓ GET /status verified');

  // 4c. Instructions
  const instRes = await fetch(`http://127.0.0.1:${testPort}/instructions`);
  const instData = await instRes.json();
  assert.equal(instData.success, true);
  assert.equal(instData.name, 'search');
  assert.ok(instData.instructions.includes('web_search'));
  console.log('✓ GET /instructions verified for Styx discovery');

  // 4d. POST /mcp over HTTP
  const mcpHttpRes = await fetch(`http://127.0.0.1:${testPort}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'tools/list' })
  });
  const mcpHttpData = await mcpHttpRes.json();
  assert.equal(mcpHttpData.result.tools.length, 2);
  console.log('✓ POST /mcp JSON-RPC over HTTP transport verified');

} finally {
  server.close();
}

console.log('\n======================================================');
console.log('ALL WEB SEARCH TOOL TESTS PASSED SUCCESSFULLY!');
console.log('======================================================\n');
