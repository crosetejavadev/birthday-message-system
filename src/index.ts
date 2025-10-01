import { config, validateConfig } from './config';
import { migrate } from './db';
import { buildApp } from './server';
import { startScheduler } from './scheduler';
import fs from 'fs';
import path from 'path';

async function main() {
  validateConfig();
  const dbDir = path.dirname(config.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  migrate();

  const app = buildApp();

  const server = app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });

  const timer = startScheduler();

  const shutdown = () => {
    clearInterval(timer);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void main();

