import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
const PORT = 5000;

// Essential middleware only
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint - keep this simple and early
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  let server: any = null;

  try {
    // Register minimal routes first
    log('Initializing minimal server routes...');
    server = await registerRoutes(app);

    // Start server with minimal configuration
    await new Promise<void>((resolve, reject) => {
      log(`Starting server on port ${PORT}...`);
      server.listen(PORT, '0.0.0.0', () => {
        log(`Server successfully bound to port ${PORT}`);
        log(`Server running in ${app.get("env")} mode`);
        log('Required environment variables:', [
          'DATABASE_URL',
          'SESSION_SECRET',
          'PORT',
        ].map(v => `${v}: ${process.env[v] ? '✓' : '✗'}`).join(', '));
        resolve();
      });

      server.on('error', (error: Error) => {
        log(`Error starting server: ${error.message}`);
        reject(error);
      });
    });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${status} - ${message}`);
      res.status(status).json({ message });
    });

    // Once server is confirmed running, add additional features
    if (app.get("env") === "development") {
      log('Setting up Vite development server...');
      try {
        await setupVite(app, server);
        log('Vite development server setup complete');
      } catch (error) {
        log(`Warning: Vite setup failed - ${error}. Continuing without Vite.`);
      }
    } else {
      log('Setting up static file serving...');
      serveStatic(app);
    }

    // Initialize badges as the last step
    log('Scheduling badge initialization...');
    setTimeout(async () => {
      try {
        await storage.createInitialBadges();
        log('Initial badges created successfully');
      } catch (error) {
        log('Error creating initial badges:', String(error));
      }
    }, 2000);

    // Register shutdown handlers
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

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    log(`Fatal error during startup: ${error}`);
    process.exit(1);
  }
}

// Start the server
startServer();