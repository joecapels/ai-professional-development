import express from "express";
import compression from "compression";
import { log, setupVite, serveStatic } from "./vite";
import helmet from "helmet";

const app = express();
// Try multiple ports, starting with the environment-provided port and 5000
const PORTS = [
  Number(process.env.PORT) || 3000,
  3000,
  3001,
  3002,
  3003
];

// Essential middleware only
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security headers with development-friendly CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Basic health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  let lastError = null;
  log(`[Config] Available ports: ${PORTS.join(', ')}, environment PORT=${process.env.PORT}`);

  // Try each port in sequence
  for (const port of PORTS) {
    try {
      log(`[Startup] Attempting to start minimal server on port ${port}...`);

      const server = await new Promise((resolve, reject) => {
        const srv = app.listen(port, '0.0.0.0', async () => {
          // Ensure CORS headers are set for WebSocket upgrade
          srv.on('upgrade', (request, socket, head) => {
            socket.on('error', (err) => {
              console.error('WebSocket error:', err);
            });
          });
          const address = srv.address();
          if (typeof address === 'object' && address) {
            log(`[Startup] Minimal server is listening on port ${address.port}`);
          }

          // Set up Vite middleware in development
          if (process.env.NODE_ENV !== 'production') {
            await setupVite(app, srv);
          } else {
            // Serve static files in production
            serveStatic(app);
          }

          resolve(srv);
        });

        srv.on('error', (error: Error & { code?: string }) => {
          log(`[Startup] Failed to bind to port ${port}: ${error.message}`);
          reject(error);
        });
      });

      // Basic error handling
      app.use((err: any, _req: any, res: any, _next: any) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        log(`[Error] ${status} - ${message}`);

        const response = app.get("env") === "development"
          ? { message, stack: err.stack }
          : { message: "Internal Server Error" };

        res.status(status).json(response);
      });

      // Graceful shutdown
      const shutdown = async (signal: string) => {
        log(`[Shutdown] Received ${signal}, starting graceful shutdown...`);
        if (server) {
          server.close(() => {
            log('[Shutdown] Closed out remaining connections');
            process.exit(0);
          });

          // Force shutdown after timeout
          setTimeout(() => {
            log('[Shutdown] Could not close connections in time, forcing shutdown');
            process.exit(1);
          }, 10000);
        }
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));

      // Successfully bound to a port
      log(`[Success] Server successfully started on port ${port}`);
      return;

    } catch (error) {
      lastError = error;
      log(`[Startup] Failed to start server on port ${port}, trying next port...`);
      continue;
    }
  }

  // If we get here, we failed to bind to any port
  log(`[Fatal] Server startup failed on all ports. Last error: ${lastError}`);
  process.exit(1);
}

startServer();