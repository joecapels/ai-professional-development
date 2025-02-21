import express from "express";
import { log } from "./vite";

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Only essential middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic error handler from original, simplified
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start server with detailed logging
async function startServer() {
  try {
    log('[Debug] Attempting to start server...');
    log(`[Debug] Using port: ${PORT}`);

    const server = await new Promise((resolve, reject) => {
      log('[Debug] Creating server instance...');

      const srv = app.listen(PORT, '0.0.0.0', () => {
        const addr = srv.address();
        log('[Debug] Server listen callback triggered');

        if (addr && typeof addr === 'object') {
          log(`[Success] Server started on port ${addr.port}`);
          resolve(srv);
        } else {
          reject(new Error('Failed to get server address'));
        }
      });

      srv.on('error', (error: Error & { code?: string }) => {
        log(`[Error] Server startup failed: ${error.message}`);
        log(`[Error] Error code: ${(error as any).code}`);
        log(`[Error] Stack trace: ${error.stack}`);
        reject(error);
      });
    });

    // Cleanup handler from original, simplified
    process.on('SIGTERM', () => {
      log('[Shutdown] Received SIGTERM');
      server.close(() => {
        log('[Shutdown] Server closed');
        process.exit(0);
      });
    });
    process.on('SIGINT', () => {
      log('[Shutdown] Received SIGINT');
      server.close(() => {
        log('[Shutdown] Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    log(`[Fatal] Could not start server: ${error}`);
    log(`[Fatal] Stack trace: ${(error as Error).stack}`);
    process.exit(1);
  }
}

startServer();