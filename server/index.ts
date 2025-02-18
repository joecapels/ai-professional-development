import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import path from "path";
import { createServer } from "node:net";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => {
      log(`Port ${port} is not available`);
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      log(`Port ${port} is available`);
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  log(`Starting port availability check from port ${startPort}`);
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${startPort + maxAttempts - 1}`);
}

(async () => {
  let server: any = null;

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    log(`Received ${signal}, starting graceful shutdown...`);

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          log('Closed out remaining connections');
          resolve();
        });

        // Force close after timeout
        setTimeout(() => {
          log('Could not close connections in time, forcing shutdown');
          resolve();
        }, 10000);
      });
    }

    process.exit(0);
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    // Initialize server
    log('Initializing server...');
    server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${status} - ${message}`);
      res.status(status).json({ message });
    });

    // Setup environment-specific middleware
    if (app.get("env") === "development") {
      log('Setting up Vite development server...');
      await setupVite(app, server);
    } else {
      log('Setting up static file serving...');
      serveStatic(app);
      app.get('*', (_req, res) => {
        if (!_req.path.startsWith('/api')) {
          res.sendFile(path.resolve(__dirname, '../dist/index.html'));
        }
      });
    }

    // Find available port
    const preferredPort = Number(process.env.PORT) || 3000;
    log(`Checking port availability starting from ${preferredPort}...`);
    const PORT = await findAvailablePort(preferredPort);

    if (PORT !== preferredPort) {
      log(`Preferred port ${preferredPort} was in use, using port ${PORT} instead`);
    }

    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      log(`Server running in ${app.get("env")} mode on port ${PORT}`);
      log('Required environment variables:', [
        'DATABASE_URL',
        'SESSION_SECRET',
        'PORT',
      ].map(v => `${v}: ${process.env[v] ? '✓' : '✗'}`).join(', '));

      // Initialize badges in background after server starts
      setTimeout(async () => {
        try {
          await storage.createInitialBadges();
          log('Initial badges created successfully');
        } catch (error) {
          log('Error creating initial badges:', String(error));
        }
      }, 1000);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      log(`Error starting server: ${error.message}`);
      process.exit(1);
    });

  } catch (error) {
    log(`Fatal error during startup: ${error}`);
    process.exit(1);
  }
})();