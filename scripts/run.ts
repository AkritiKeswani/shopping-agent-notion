#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { join } from 'path';

async function runShoppingAgent() {
  console.log('🚀 Starting Shopping Agent...');
  
  const mcpPath = join(process.cwd(), 'mcp', 'server.ts');
  
  const child = spawn('npx', ['tsx', mcpPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  child.stdout.on('data', (data) => {
    console.log('MCP Output:', data.toString());
  });

  child.stderr.on('data', (data) => {
    console.error('MCP Error:', data.toString());
  });

  child.on('close', (code) => {
    console.log(`MCP process exited with code ${code}`);
  });

  // Example tool call
  setTimeout(() => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_and_extract',
        arguments: {
          brand: 'Aritzia',
          query: 'tops',
          size: 'M',
          monthISO: '2025-01-01',
          topN: 6
        }
      }
    };

    console.log('Sending request:', JSON.stringify(request, null, 2));
    child.stdin.write(JSON.stringify(request) + '\n');
  }, 2000);
}

runShoppingAgent().catch(console.error);

