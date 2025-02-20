import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import helmet from "helmet";
import compression from "compression";

const app = express();
const PORT = 5000;

// Enhanced logging middleware with request timing
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    const start = Date.now();
    log(`[${req.method}] ${req.path} - Starting request`);

    // Log response time on completion
    _res.on('finish', () => {
      const duration = Date.now() - start;
      log(`[${req.method}] ${req.path} - Completed in ${duration}ms`);
    });
  }
  next();
});

// Essential middleware only
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint - keep this minimal
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function startServer() {
  let server: any = null;

  try {
    log('Starting minimal server setup...');

    // Register critical routes only
    log('Setting up essential API routes...');
    server = await registerRoutes(app);
    log('API routes setup complete');

    // Simple port binding with a single retry
    const bindPort = async (port: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        log(`Attempting to bind to port ${port}...`);
        server = app.listen(port, '0.0.0.0', () => {
          log(`Server successfully bound to port ${port}`);
          resolve();
        }).on('error', (error: Error & { code?: string }) => {
          reject(error);
        });
      });
    };

    try {
      await bindPort(PORT);
    } catch (error: any) {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${PORT} is in use, trying ${PORT + 1}...`);
        await bindPort(PORT + 1);
      } else {
        throw error;
      }
    }

    // Minimal logging
    log(`Server running in ${app.get("env")} mode`);

    // Defer non-critical setup
    setTimeout(() => {
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

      // Development features
      if (app.get("env") === "development") {
        log('Setting up development features...');
        setupVite(app, server).catch(error => {
          log(`Vite setup warning: ${error}`);
        });
      } else {
        app.set('trust proxy', 1);
        serveStatic(app);
      }

      // Initialize badges
      storage.createInitialBadges().catch(error => {
        log('Badge initialization error:', error);
      });
    }, 1000);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error [${status}]:`, {
        message,
        path: _req.path,
        stack: app.get("env") === "development" ? err.stack : undefined
      });

      res.status(status).json({
        message: app.get("env") === "development" ? message : "Internal Server Error",
        ...(app.get("env") === "development" && { stack: err.stack })
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      log(`Received ${signal}, shutting down...`);
      if (server) {
        server.close(() => {
          log('Server closed');
          process.exit(0);
        });
        setTimeout(() => {
          log('Forcing exit after timeout');
          process.exit(1);
        }, 5000);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    log('Fatal server error:', error);
    process.exit(1);
  }
}

// Start the server
startServer();