import { startServer } from './server.js';

if (import.meta.main) {
  await startServer();
}

export { createApp, getPortFromArgs } from './server.js';
