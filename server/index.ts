import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Handle graceful shutdown
  const shutdown = () => {
    log('Received kill signal, shutting down gracefully');
    server.close(() => {
      log('Closed out remaining connections');
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      log('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  const PORT = process.env.PORT || 5000;
  const MAX_RETRIES = 3;
  let retries = 0;

  const startServer = () => {
    server.listen(PORT, "0.0.0.0", () => {
      log(`serving on port ${PORT}`);
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