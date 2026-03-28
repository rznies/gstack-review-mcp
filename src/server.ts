import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { toolDefinitions } from './tools/registry.js';

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const DEFAULT_PORT = 10000;

function parseJsonBody(request: Request) {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return undefined;
  }

  return request
    .clone()
    .text()
    .then((text) => {
      if (!text.trim()) return undefined;
      return JSON.parse(text);
    })
    .catch(() => undefined);
}

function jsonRpcResult(id: JsonRpcRequest['id'], result: unknown, status = 200) {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function jsonRpcError(id: JsonRpcRequest['id'], code: number, message: string, data?: unknown) {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code, message, ...(data === undefined ? {} : { data }) },
    }),
    { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } }
  );
}

export function createApp() {
  const app = new Hono();

  app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'], allowHeaders: ['Content-Type', 'Mcp-Session-Id'] }));

  app.get('/', (c) => c.json({ status: 'ok', skills: 4 }));

  app.all('/mcp', async (c) => {
    const parsedBody = await parseJsonBody(c.req.raw);
    const request = parsedBody as JsonRpcRequest | undefined;

    if (!request || request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
      return jsonRpcError(request?.id ?? null, -32600, 'Invalid Request');
    }

    if (request.method === 'initialize') {
      return jsonRpcResult(request.id ?? null, {
        protocolVersion: request.params && typeof request.params === 'object' ? (request.params as { protocolVersion?: string }).protocolVersion ?? '2024-11-05' : '2024-11-05',
        serverInfo: { name: 'gstack-review-mcp', version: '0.1.0' },
        capabilities: { tools: {} },
      });
    }

    if (request.method === 'tools/list') {
      const tools = Object.entries(toolDefinitions).map(([name, definition]) => ({
        name,
        title: name,
        description: name === 'list-available-reviews' ? 'Discover the gstack review tools available in this server.' : 'Review tool',
        inputSchema: definition.schema,
      }));
      return jsonRpcResult(request.id ?? null, { tools });
    }

    if (request.method === 'tools/call') {
      const params = request.params ?? {};
      const toolName = typeof params.name === 'string' ? params.name : undefined;
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      const tool = toolName ? toolDefinitions[toolName as keyof typeof toolDefinitions] : undefined;

      if (!tool) {
        return jsonRpcError(request.id ?? null, -32601, `Unknown tool: ${toolName ?? 'missing'}`);
      }

      const parsed = tool.schema.safeParse(args);
      if (!parsed.success) {
        return jsonRpcError(request.id ?? null, -32602, 'Invalid params', parsed.error.flatten());
      }

      return jsonRpcResult(request.id ?? null, await tool.handler(parsed.data as never));
    }

    return jsonRpcError(request.id ?? null, -32601, `Method not found: ${request.method}`);
  });

  return app;
}

export function getPortFromArgs(argv = Bun.argv.slice(2)) {
  const flagIndex = argv.indexOf('--port');
  if (flagIndex >= 0 && argv[flagIndex + 1]) {
    const parsed = Number(argv[flagIndex + 1]);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  const httpIndex = argv.indexOf('--http');
  if (httpIndex >= 0 && argv[httpIndex + 1]) {
    const parsed = Number(argv[httpIndex + 1]);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  const envPort = Number(Bun.env.PORT ?? DEFAULT_PORT);
  return Number.isNaN(envPort) ? DEFAULT_PORT : envPort;
}

export async function startServer() {
  const app = createApp();
  const port = getPortFromArgs();
  Bun.serve({ fetch: app.fetch, port });
  console.log(`gstack-review-mcp listening on ${port}`);
}
