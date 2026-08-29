import 'dotenv/config';
import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './lib/logger.js';

// ─── Server Entry Point ─────────────────────────────────────────────────────

const server = app.listen(config.port, () => {
  logger.info(
    {
      port: config.port,
      env: config.nodeEnv,
      cors: config.cors.origin,
    },
    `🚀 EPCMS API server running on port ${config.port}`,
  );
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const shutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(() => {
    logger.info('Server closed. Process exiting.');
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown fails
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled Errors ────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  logger.error({ err: reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err }, 'Uncaught Exception — shutting down');
  process.exit(1);
});
