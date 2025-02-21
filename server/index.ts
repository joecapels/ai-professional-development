import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import helmet from "helmet";
import compression from "compression";

const app = express();
const PORT = 5000;

// Security middleware
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

// Performance middleware
app.use(compression());

// Essential middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up authentication
setupAuth(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: app.get("env"),
    uptime: process.uptime()
  });
});

async function startServer() {
  let server: any = null;

  try {
    // Step 1: Initialize essential routes
    log('[Startup] Initializing essential routes...');
    server = await registerRoutes(app);

    // Step 2: Bind to port quickly
    log('[Startup] Attempting to bind to port...');
    await new Promise<void>((resolve, reject) => {
      server = app.listen(PORT, '0.0.0.0', () => {
        log('[Startup] Successfully bound to port ' + PORT);
        resolve();
      });

      server.on('error', (error: Error & { code?: string }) => {
        log(`[Startup] Server binding error: ${error.message}`);
        reject(error);
      });
    });

    // Step 3: Log successful startup
    log(`[Startup] Server running in ${app.get("env")} mode`);
    log('[Startup] Environment check:', [
      'DATABASE_URL',
      'SESSION_SECRET'
    ].map(v => `${v}: ${process.env[v] ? '✓' : '✗'}`).join(', '));

    // Step 4: Set up error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`[Error] ${status} - ${message}`);

      const response = app.get("env") === "development"
        ? { message, stack: err.stack }
        : { message: "Internal Server Error" };

      res.status(status).json(response);
    });

    // Step 5: Initialize development/production features async
    setTimeout(async () => {
      try {
        if (app.get("env") === "development") {
          log('[Setup] Initializing Vite development server...');
          await setupVite(app, server);
          log('[Setup] Vite development server initialized');
        } else {
          log('[Setup] Setting up static file serving...');
          app.set('trust proxy', 1);
          serveStatic(app);
          log('[Setup] Static file serving configured');
        }
      } catch (error) {
        log(`[Setup] Warning: Development setup error: ${error}`);
      }
    }, 100);

    // Step 6: Initialize badges async
    setTimeout(async () => {
      try {
        log('[Setup] Starting badge initialization...');
        await storage.createInitialBadges();
        log('[Setup] Badge initialization completed');
      } catch (error) {
        log(`[Setup] Warning: Badge initialization error: ${error}`);
      }
    }, 500);

    // Step 7: Register shutdown handlers
    const shutdown = async (signal: string) => {
      log(`[Shutdown] Received ${signal}, starting graceful shutdown...`);
      if (server) {
        await new Promise<void>((resolve) => {
          server.close(() => {
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
    log(`[Fatal] Startup error: ${error}`);
    process.exit(1);
  }
}

startServer();