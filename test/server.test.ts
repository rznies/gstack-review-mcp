import { expect, test } from 'bun:test';
import { createApp, getPortFromArgs } from '../src/server.js';

test('health check reports service readiness', async () => {
  const app = createApp();
  const res = await app.request('/');

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: 'ok', skills: 4 });
});

test('port parsing prefers CLI flag over env', () => {
  expect(getPortFromArgs(['--port', '4321'])).toBe(4321);
});

test('port parsing falls back to default port', () => {
  expect(getPortFromArgs([])).toBe(10000);
});
