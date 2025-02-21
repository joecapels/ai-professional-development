import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import helmet from "helmet";
import compression from "compression";
import { createServer } from "net";

const app = express();
const DEFAULT_PORT = 5000;

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

// Function to check if a port is available
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}


async function startServer() {
  let server: any = null;

  try {
    // Check for required environment variables
    const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET', 'OPENAI_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    log('Initializing server routes...');
    server = await registerRoutes(app);

    await new Promise<void>((resolve, reject) => {
      log(`Starting server on port ${DEFAULT_PORT}...`);

      server = app.listen(DEFAULT_PORT, '0.0.0.0', () => {
        log(`Server successfully started on port ${DEFAULT_PORT}`);
        log(`Server running in ${app.get("env")} mode`);
        log('Required environment variables:', [
          'DATABASE_URL',
          'SESSION_SECRET',
          'OPENAI_API_KEY'
        ].map(v => `${v}: ${process.env[v] ? '✓' : '✗'}`).join(', '));
        resolve();
      });

      server.on('error', async (error: Error & { code?: string }) => {
        if (error.code === 'EADDRINUSE') {
          log(`Port ${DEFAULT_PORT} is already in use, trying alternative port...`);
          // Try next available port
          server = app.listen(0, '0.0.0.0', () => {
            const port = (server.address() as any).port;
            log(`Server successfully started on alternative port ${port}`);
            log(`Server running in ${app.get("env")} mode`);
            resolve();
          });
        } else {
          log(`Error starting server: ${error.message}`);
          reject(error);
        }
      });

      // Set a timeout for server startup
      setTimeout(() => {
        reject(new Error('Server startup timeout exceeded'));
      }, 15000);
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

    // Initialize badges after server is running
    log('Initializing badges...');
    await storage.createInitialBadges().catch(error => {
      log(`Warning: Failed to initialize badges: ${error.message}`);
    });
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