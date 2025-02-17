import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import path from "path";

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

(async () => {
  const server = await registerRoutes(app);

  // Initialize badges after routes are registered
  try {
    await storage.createInitialBadges();
    log('Initial badges created successfully');
  } catch (error) {
    log('Error creating initial badges:', String(error));
  }

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error: ${status} - ${message}`);
    res.status(status).json({ message });
  });

  // Setup static file serving or Vite based on environment
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
    // Serve index.html for client-side routing
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.resolve(__dirname, '../dist/index.html'));
      }
    });
  }

  // Graceful shutdown handler
  const shutdown = () => {
    log('Received kill signal, shutting down gracefully');
    server.close(() => {
      log('Closed out remaining connections');
      process.exit(0);
    });

    setTimeout(() => {
      log('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Server startup with retry logic
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = '0.0.0.0'; // Allow external connections

  const startServer = () => {
    server.listen(PORT, HOST, () => {
      log(`Server running in ${app.get("env")} mode on port ${PORT}`);
      log('Required environment variables:', [
        'DATABASE_URL',
        'SESSION_SECRET',
        'PORT',
      ].map(v => `${v}: ${process.env[v] ? '✓' : '✗'}`).join(', '));
    }).on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${PORT} is in use`);
        if (retries < MAX_RETRIES) {
          retries++;
          log(`Retrying in 1 second... (Attempt ${retries}/${MAX_RETRIES})`);
          setTimeout(startServer, 1000);
        } else {
          log('Max retries reached. Could not start server.');
          process.exit(1);
        }
      } else {
        log(`Error starting server: ${error.message}`);
        process.exit(1);
      }
    });
  };

  startServer();
})();