import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import helmet from "helmet";
import compression from "compression";

const app = express();
const PORT = process.env.PORT || 5000;

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
    log('Initializing server routes...');
    server = await registerRoutes(app);

    await new Promise<void>((resolve, reject) => {
      log(`Starting server on port ${PORT}...`);

      server = app.listen(PORT, '0.0.0.0', () => {
        log(`Server successfully started on port ${PORT}`);
        log(`Server running in ${app.get("env")} mode`);
        log('Required environment variables:', [
          'DATABASE_URL',
          'SESSION_SECRET'
        ].map(v => `${v}: ${process.env[v] ? '✓' : '✗'}`).join(', '));
        resolve();
      });

      server.on('error', (error: Error & { code?: string }) => {
        log(`Error starting server: ${error.message}`);
        reject(error);
      });
    });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${status} - ${message}`);

      const response = app.get("env") === "development"
        ? { message, stack: err.stack }
        : { message: "Internal Server Error" };

      res.status(status).json(response);
    });

    // Setup development/production specific features
    if (app.get("env") === "development") {
      log('Setting up Vite development server...');
      await setupVite(app, server);
      log('Vite development server setup complete');
    } else {
      log('Setting up static file serving...');
      app.set('trust proxy', 1);
      serveStatic(app);
    }

    // Initialize badges
    log('Initializing badges...');
    await storage.createInitialBadges();
    log('Initial badges created successfully');

    // Register shutdown handlers
    const shutdown = async (signal: string) => {
      log(`Received ${signal}, starting graceful shutdown...`);
      if (server) {
        await new Promise<void>((resolve) => {
          server.close(() => {
            log('Closed out remaining connections');
            resolve();
          });

          setTimeout(() => {
            log('Could not close connections in time, forcing shutdown');
            resolve();
          }, 10000);
        });
      }
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    log(`Fatal error during startup: ${error}`);
    process.exit(1);
  }
}

startServer();