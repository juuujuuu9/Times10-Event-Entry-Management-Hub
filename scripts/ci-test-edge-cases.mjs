#!/usr/bin/env node
/**
 * Single-command edge-case test runner.
 * Starts dev server with BYPASS_AUTH_FOR_TESTS, runs tests, then exits.
 * Run with: npm run test:edge-cases:ci
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const BASE_URL = 'http://localhost:4321';
const WAIT_MS = 8000;

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < WAIT_MS) {
    try {
      const res = await fetch(`${BASE_URL}/api/send-email`);
      if (res.ok || res.status === 401) return true; // server is up
    } catch {
      await setTimeout(500);
    }
  }
  throw new Error('Server did not become ready in time');
}

async function main() {
  const server = spawn('npm', ['run', 'dev'], {
    env: { ...process.env, BYPASS_AUTH_FOR_TESTS: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  server.stdout?.on('data', (d) => { serverOutput += d; });
  server.stderr?.on('data', (d) => { serverOutput += d; });

  const cleanup = () => {
    server.kill('SIGTERM');
    process.exit(1);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await waitForServer();
    const { spawn: runTests } = await import('child_process');
    const testProc = runTests('node', ['scripts/test-edge-cases.mjs', BASE_URL], {
      env: { ...process.env, BYPASS_AUTH_FOR_TESTS: 'true' },
      stdio: 'inherit',
    });
    const code = await new Promise((resolve) => testProc.on('close', resolve));
    server.kill('SIGTERM');
    process.exit(code);
  } catch (err) {
    console.error(err.message);
    server.kill('SIGTERM');
    process.exit(1);
  }
}

main();
