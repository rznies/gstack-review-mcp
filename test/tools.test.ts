import { expect, test } from 'bun:test';
import { createApp } from '../src/server.js';

const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'bun-test', version: '1.0.0' },
  },
};

test('mcp exposes the review tools', async () => {
  const app = createApp();
  const init = await app.request('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(initRequest),
  });

  expect(init.status).toBe(200);

  const sessionId = init.headers.get('mcp-session-id') ?? init.headers.get('Mcp-Session-Id');
  const list = await app.request('/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    }),
  });

  expect(list.status).toBe(200);
  const body = await list.text();
  expect(body).toContain('list-available-reviews');
  expect(body).toContain('plan-ceo-review');
  expect(body).toContain('design-consultation');
  expect(body).toContain('plan-design-review');
  expect(body).toContain('plan-eng-review');
});

test('plan-ceo-review returns structured guidance', async () => {
  const app = createApp();
  await app.request('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(initRequest),
  });

  const res = await app.request('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'plan-ceo-review',
        arguments: {
          planContent: 'Ship a thing users want.',
          scopeMode: 'selective',
          additionalContext: 'Focus on the wedge.',
        },
      },
    }),
  });

  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text).toContain('CEO Review');
  expect(text).toContain('Scope mode: selective');
  expect(text).toContain('GStack voice');
  expect(text.length).toBeGreaterThan(1000);
});

test('plan-ceo-review validates required plan content', async () => {
  const app = createApp();
  await app.request('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(initRequest),
  });

  const res = await app.request('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'plan-ceo-review',
        arguments: {
          scopeMode: 'hold',
        },
      },
    }),
  });

  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text.toLowerCase()).toContain('error');
});

test('malformed json returns parse error', async () => {
  const app = createApp();
  const res = await app.request('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not json',
  });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.error.code).toBe(-32700);
  expect(body.error.message).toBe('Parse error');
});

test('oversized body is rejected before parsing', async () => {
  const app = createApp();
  const res = await app.request('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'plan-ceo-review',
        arguments: { planContent: 'x'.repeat(70 * 1024) },
      },
    }),
  });

  expect(res.status).toBe(413);
  const body = await res.json();
  expect(body.error).toBe('Request body too large');
});
