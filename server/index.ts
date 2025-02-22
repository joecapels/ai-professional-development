import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import helmet from "helmet";
import compression from "compression";
import path from "path";

const app = express();
const DEFAULT_PORT = 5000;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;
const FALLBACK_PORTS = [3000, 3001, 3002, 5000, 5001, 8080];

// Security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
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

// Health check endpoint - keep this simple and early
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: app.get("env"),
    uptime: process.uptime()
  });
});

async function tryPort(port: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, '0.0.0.0')
      .once('listening', () => {
        log(`Server successfully bound to port ${port}`);
        resolve(server);
      })
      .once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          log(`Port ${port} is already in use`);
          server.close();
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(err);
        }
      });
  });
}

async function startServer() {
  let server: any = null;

  try {
    // Register API routes first
    log('Initializing server routes...');
    server = await registerRoutes(app);

    // Try ports until one works
    let currentPortIndex = 0;
    let success = false;

    while (!success && currentPortIndex < FALLBACK_PORTS.length) {
      const currentPort = FALLBACK_PORTS[currentPortIndex];
      try {
        log(`Attempting to start server on port ${currentPort}...`);
        server = await tryPort(currentPort);
        success = true;
        log(`Server running on port ${currentPort} in ${app.get("env")} mode`);
      } catch (error: any) {
        if (error.code === 'EADDRINUSE' || error.message.includes('already in use')) {
          currentPortIndex++;
          continue;
        }
        throw error;
      }
    }

    if (!success) {
      throw new Error('Unable to find an available port');
    }

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

    // Setup static files and SPA handling after API routes
    if (app.get("env") === "development") {
      log('Setting up Vite development server...');
      await setupVite(app, server);
      log('Vite development server setup complete');
    } else {
      log('Setting up static file serving...');
      app.set('trust proxy', 1);
      serveStatic(app);
    }

    // Catch-all route for SPA - must be after API routes and static files
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      // In development, this will be handled by Vite
      // In production, it will serve the static index.html
      if (app.get("env") === "development") {
        next();
      } else {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
      }
    });

    // Initialize badges in background
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