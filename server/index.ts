import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import helmet from "helmet";
import compression from "compression";

const app = express();
// Support multiple deployment ports
const PORTS = [5000, 5001, 5002].filter(port => !isNaN(Number(port)));
const PRIMARY_PORT = PORTS[0]; // Main deployment port

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
    uptime: process.uptime(),
    port: req.socket.localPort
  });
});

async function startServer() {
  let servers: any[] = [];

  try {
    // Register minimal routes first
    log('Initializing minimal server routes...');

    // Try to start servers on multiple ports
    for (const PORT of PORTS) {
      try {
        log(`Starting server on port ${PORT}...`);
        const server = await registerRoutes(app);

        await new Promise<void>((resolve, reject) => {
          server.listen(PORT, '0.0.0.0', () => {
            log(`Server successfully bound to port ${PORT}`);
            servers.push(server);
            resolve();
          });

          server.on('error', (error: Error & { code?: string }) => {
            if (error.code === 'EADDRINUSE') {
              log(`Port ${PORT} is already in use, skipping...`);
              resolve(); // Continue with other ports
            } else {
              log(`Error starting server on port ${PORT}: ${error.message}`);
              reject(error);
            }
          });
        });
      } catch (error) {
        log(`Failed to start server on port ${PORT}: ${error}`);
        // Continue trying other ports
        continue;
      }
    }

    if (servers.length === 0) {
      throw new Error('Failed to start server on any port');
    }

    log(`Server running in ${app.get("env")} mode`);
    log('Required environment variables:', [
      'DATABASE_URL',
      'SESSION_SECRET',
      'PORT',
    ].map(v => `${v}: ${process.env[v] ? '✓' : '✗'}`).join(', '));

    // Set up development or production features
    if (app.get("env") === "development") {
      log('Setting up Vite development server...');
      try {
        await setupVite(app, servers[0]); // Use primary server for Vite
        log('Vite development server setup complete');
      } catch (error) {
        log(`Warning: Vite setup failed - ${error}. Continuing without Vite.`);
      }
    } else {
      log('Setting up static file serving...');
      app.set('trust proxy', 1);
      serveStatic(app);
    }

    // Initialize badges
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

      await Promise.all(servers.map(async (server) => {
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
      }));

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