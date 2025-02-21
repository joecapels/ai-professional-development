import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import helmet from "helmet";
import compression from "compression";
import { Server } from "http";

const app = express();
// Try multiple ports if the default is taken
const BASE_PORT = parseInt(process.env.PORT || "3000", 10);
let PORT = BASE_PORT;
log(`[Config] Initial port: ${PORT}`);

// Essential middleware that must be registered immediately
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());

// Basic security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "*.replit.dev"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*.replit.dev"],
      styleSrc: ["'self'", "'unsafe-inline'", "*.replit.dev"],
      imgSrc: ["'self'", "data:", "blob:", "*.replit.dev"],
      connectSrc: ["'self'", "*.replit.dev", process.env.NODE_ENV === "development" ? "*" : ""]
    }
  }
}));

// Register health check endpoint immediately
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  let server: Server | null = null;
  let retries = 3;

  while (retries > 0) {
    try {
      log(`[Startup] Attempting to start server on port ${PORT}...`);

      // Create server instance with proper error handling
      server = await new Promise<Server>((resolve, reject) => {
        const srv = app.listen(PORT, () => {
          log(`[Startup] Server successfully started on port ${PORT}`);
          resolve(srv);
        });

        srv.on('error', (error: Error & { code?: string }) => {
          if (error.code === 'EADDRINUSE') {
            log(`[Startup] Port ${PORT} is in use, trying next port...`);
            PORT++;
            reject(new Error('PORT_IN_USE'));
          } else {
            log(`[Startup] Server error: ${error.message}`);
            reject(error);
          }
        });
      });

      // If we get here, server started successfully
      break;
    } catch (error) {
      if (error instanceof Error && error.message === 'PORT_IN_USE') {
        retries--;
        if (retries === 0) {
          throw new Error(`Unable to find available port after trying ports ${BASE_PORT}-${PORT}`);
        }
        continue;
      }
      throw error;
    }
  }

  // Initialize remaining features asynchronously
  process.nextTick(async () => {
    try {
      // Setup auth first as it's required for routes
      log('[Setup] Configuring authentication...');
      setupAuth(app);
      log('[Setup] Authentication configured successfully');

      // Register routes
      log('[Setup] Registering routes...');
      await registerRoutes(app);
      log('[Setup] Routes registered successfully');

      // Setup development/production specific features
      if (app.get("env") === "development") {
        log('[Setup] Initializing Vite development server...');
        try {
          await setupVite(app, server!);
          log('[Setup] Vite development server initialized successfully');
        } catch (error) {
          log(`[Setup] Error initializing Vite: ${error}`);
          // Continue without Vite in case of error
        }
      } else {
        log('[Setup] Setting up static file serving...');
        app.set('trust proxy', 1);
        serveStatic(app);
        log('[Setup] Static file serving configured successfully');
      }

      log('[Setup] Server initialization completed successfully');

    } catch (error) {
      const err = error as Error;
      log(`[Setup] Error during initialization: ${err.message}`);
      log(`[Setup] Stack trace: ${err.stack}`);
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
}

startServer().catch((error) => {
  log(`[Fatal] Server startup failed: ${error.message}`);
  log(`[Fatal] Stack trace: ${error.stack}`);
  process.exit(1);
});