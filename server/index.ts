import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import helmet from "helmet";
import compression from "compression";
import { Server } from "http";

const app = express();
// Ensure PORT is properly parsed as a number and log for debugging
const PORT = Number(process.env.PORT) || 5000;
log(`[Config] Port configuration: process.env.PORT=${process.env.PORT}, using port: ${PORT}`);

// Essential middleware that must be registered immediately
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());

// Basic security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", process.env.NODE_ENV === "development" ? "*" : ""]
    }
  }
}));

// Register health check endpoint immediately
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  let server: Server | null = null;

  try {
    // Step 1: Bind to port immediately
    server = app.listen(PORT);

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      if (!server) {
        reject(new Error('Server instance is null'));
        return;
      }

      server.once('listening', () => {
        const address = server?.address();
        if (typeof address === 'object' && address) {
          log(`[Startup] Server is listening on port ${address.port}`);
        }
        resolve();
      });

      server.once('error', (error: Error & { code?: string }) => {
        log(`[Startup] Failed to bind to port ${PORT}: ${error.message}`);
        if (error.code === 'EADDRINUSE') {
          log('[Startup] Port is already in use. Please make sure no other service is using this port.');
        }
        reject(error);
      });
    });

    // Step 2: Initialize remaining features asynchronously
    process.nextTick(async () => {
      try {
        // Setup auth first as it's required for routes
        log('[Setup] Configuring authentication...');
        setupAuth(app);
        log('[Setup] Authentication configured');

        // Register routes
        log('[Setup] Registering routes...');
        await registerRoutes(app);
        log('[Setup] Routes registered');

        // Setup development/production specific features
        if (app.get("env") === "development") {
          log('[Setup] Initializing Vite development server...');
          await setupVite(app, server!);
          log('[Setup] Vite development server ready');
        } else {
          log('[Setup] Setting up static file serving...');
          app.set('trust proxy', 1);
          serveStatic(app);
          log('[Setup] Static file serving configured');
        }

        // Initialize badges last as it's not critical for server operation
        log('[Setup] Initializing badges...');
        await storage.createInitialBadges();
        log('[Setup] Badge initialization complete');

      } catch (error) {
        log(`[Setup] Error during initialization: ${error}`);
        // Don't exit process on initialization error, just log it
        log('[Setup] Server will continue running with limited functionality');
      }
    });

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`[Error] ${status} - ${message}`);

      const response = app.get("env") === "development"
        ? { message, stack: err.stack }
        : { message: "Internal Server Error" };

      res.status(status).json(response);
    });

    // Graceful shutdown handler
    const shutdown = async (signal: string) => {
      log(`[Shutdown] Received ${signal}, starting graceful shutdown...`);
      if (server) {
        await new Promise<void>((resolve) => {
          server!.close(() => {
            log('[Shutdown] Closed out remaining connections');
            resolve();
          });

          setTimeout(() => {
            log('[Shutdown] Could not close connections in time, forcing shutdown');
            resolve();
          }, 10000);
        });
      }
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    log(`[Fatal] Server startup failed: ${error}`);
    process.exit(1);
  }
}

startServer();