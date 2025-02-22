import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import helmet from "helmet";
import compression from "compression";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

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

// Essential middleware only
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint - keep this simple and early
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
    // Register minimal routes first
    log('Initializing minimal server routes...');
    server = await registerRoutes(app);

    // Start server with better error handling for port conflicts
    await new Promise<void>((resolve, reject) => {
      log(`Starting server on port ${PORT}...`);

      // Try to create server first
      server = app.listen(PORT, '0.0.0.0', () => {
        log(`Server successfully bound to port ${PORT}`);
        log(`Server running in ${app.get("env")} mode`);
        resolve();
      });

      // Enhanced error handling
      server.on('error', (error: Error & { code?: string }) => {
        if (error.code === 'EADDRINUSE') {
          log(`Port ${PORT} is already in use`);
          reject(new Error(`Port ${PORT} is already in use`));
        } else {
          log(`Error starting server: ${error.message}`);
          reject(error);
        }
      });

      // Add timeout to detect slow startup
      const startupTimeout = setTimeout(() => {
        reject(new Error(`Server startup timed out after 15 seconds`));
      }, 15000);

      // Clear timeout on successful start
      server.on('listening', () => {
        clearTimeout(startupTimeout);
      });
    });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${status} - ${message}`);

      // Don't expose error details in production
      const response = app.get("env") === "development"
        ? { message, stack: err.stack }
        : { message: "Internal Server Error" };

      res.status(status).json(response);
    });

    // Once server is confirmed running, setup development or production environment
    if (app.get("env") === "development") {
      log('Setting up Vite development server...');
      await setupVite(app, server);
      log('Vite development server setup complete');
    } else {
      log('Setting up static file serving...');
      app.set('trust proxy', 1);
      serveStatic(app);
    }

    // Initialize badges asynchronously
    log('Initializing badges in background...');
    setTimeout(async () => {
      try {
        await storage.createInitialBadges();
        log('Initial badges created successfully');
      } catch (error) {
        log('Error creating initial badges:', String(error));
      }
    }, 0);

    // Register shutdown handlers
    const shutdown = async (signal: string) => {
      log(`Received ${signal}, starting graceful shutdown...`);
      if (server) {
        server.close(() => {
          log('Closed out remaining connections');
          process.exit(0);
        });

        // Force close after timeout
        setTimeout(() => {
          log('Could not close connections in time, forcing shutdown');
          process.exit(1);
        }, 10000);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    log(`Fatal error during startup: ${error}`);
    process.exit(1);
  }
}

// Start the server
startServer();