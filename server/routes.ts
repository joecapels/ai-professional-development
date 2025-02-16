import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { StudyMaterial, Progress, type LearningPreferences, type StudySessionMessage, studySessionMessageSchema } from "@shared/schema";
import { generateStudyRecommendations, generatePracticeQuestions, handleStudyChat, generateMoodSuggestion } from "./openai";
import { generateAdvancedAnalytics, generatePersonalizedStudyPlan } from "./analytics";
import session from "express-session";
import { pool } from "./db";

// Extend the IncomingMessage type to include session
interface WebSocketRequestWithSession extends IncomingMessage {
  session?: {
    passport?: {
      user?: number;
    };
  };
}

// Track active study sessions
const activeSessions = new Map<number, {
  ws: WebSocket;
  userId: number;
  sessionData: any;
}>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware with updated configuration
  app.use(
    session({
      store: storage.sessionStore,
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
      name: 'sid' // Set a specific cookie name
    })
  );

  setupAuth(app);
  const httpServer = createServer(app);

  // Set up WebSocket server with session handling
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (ws: WebSocket, req: WebSocketRequestWithSession) => {
    // Check authentication
    if (!req.session?.passport?.user) {
      console.log("WebSocket connection attempt without authentication");
      ws.close(1008, 'Authentication required');
      return;
    }

    const userId = req.session.passport.user;
    console.log(`WebSocket authenticated for user ${userId}`);

    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        const validatedMessage = studySessionMessageSchema.parse(message);

        switch (validatedMessage.type) {
          case 'start':
            // Start new study session
            const session = await storage.createStudySession({
              userId,
              subject: validatedMessage.data?.subject || 'General',
              status: 'active',
            });
            activeSessions.set(session.id, { ws, userId, sessionData: session });
            ws.send(JSON.stringify({ type: 'session_started', sessionId: session.id }));
            break;

          case 'pause':
          case 'resume':
            await storage.updateStudySessionStatus(validatedMessage.sessionId,
              validatedMessage.type === 'pause' ? 'paused' : 'active');
            break;

          case 'break_start':
          case 'break_end':
            await storage.updateStudySessionBreaks(validatedMessage.sessionId, {
              startTime: validatedMessage.type === 'break_start' ? new Date().toISOString() : undefined,
              endTime: validatedMessage.type === 'break_end' ? new Date().toISOString() : undefined,
            });
            break;

          case 'end':
            await storage.completeStudySession(validatedMessage.sessionId);
            activeSessions.delete(validatedMessage.sessionId);
            break;

          case 'update_metrics':
            if (validatedMessage.data?.metrics) {
              await storage.updateStudySessionMetrics(
                validatedMessage.sessionId,
                validatedMessage.data.metrics
              );
            }
            break;
        }
      } catch (error: any) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ type: 'error', message: error.message }));
      }
    });

    ws.on('close', () => {
      // Clean up any active sessions for this connection
      // Using Array.from to convert the Map entries iterator to an array
      for (const [sessionId, session] of Array.from(activeSessions.entries())) {
        if (session.ws === ws) {
          storage.completeStudySession(sessionId);
          activeSessions.delete(sessionId);
        }
      }
    });
  });

  // Study materials routes
  app.get("/api/materials", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const materials = await storage.getAllMaterials();
    res.json(materials);
  });

  app.post("/api/materials", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    const material = await storage.createMaterial(req.body);
    res.json(material);
  });

  // Progress tracking routes
  app.get("/api/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const progress = await storage.getProgressByUser(req.user.id);
    res.json(progress);
  });

  app.post("/api/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const progress = await storage.createProgress({
      ...req.body,
      userId: req.user.id,
    });
    res.json(progress);
  });

  // Learning preferences routes
  app.get("/api/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.getUser(req.user.id);
    res.json(user?.learningPreferences || null);
  });

  app.post("/api/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const preferences: LearningPreferences = req.body;
    const user = await storage.updateUserPreferences(req.user.id, preferences);
    res.json(user.learningPreferences);
  });

  // AI recommendations route
  app.get("/api/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const progress = await storage.getProgressByUser(req.user.id);
    const recommendations = await generateStudyRecommendations(progress);
    res.json(recommendations);
  });

  // Practice questions route
  app.post("/api/practice", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { subject, difficulty } = req.body;
    const questions = await generatePracticeQuestions(subject, difficulty);
    res.json(questions);
  });

  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    const user = await storage.getUser(req.user.id);
    const response = await handleStudyChat(message, user?.learningPreferences);
    res.json({ message: response });
  });

  // Add quiz routes here
  app.post("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { subject, difficulty } = req.body;
    const questions = await generatePracticeQuestions(subject, difficulty);

    const quiz = await storage.createQuiz({
      userId: req.user.id,
      subject,
      difficulty,
      questions,
    });

    res.json(quiz);
  });

  app.post("/api/quiz-results", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = await storage.createQuizResult({
      ...req.body,
      userId: req.user.id,
      score: calculateScore(req.body.answers),
    });

    res.json(result);
  });

  app.get("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const quizzes = await storage.getQuizzesByUser(req.user.id);
    res.json(quizzes);
  });

  app.get("/api/quiz-results", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const results = await storage.getQuizResultsByUser(req.user.id);
    res.json(results);
  });


  app.post("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const document = await storage.saveDocument({
      ...req.body,
      userId: req.user.id,
    });
    res.json(document);
  });

  app.get("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const documents = await storage.getDocumentsByUser(req.user.id);
    res.json(documents);
  });

  app.get("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document || document.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    res.json(document);
  });

  // Analytics routes with proper authentication and error handling
  app.get("/api/analytics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        console.log("Unauthorized access attempt to analytics");
        return res.sendStatus(401);
      }

      console.log(`Generating analytics for user ${req.user.id}`);
      const analytics = await generateAdvancedAnalytics(req.user.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ error: "Failed to generate analytics" });
    }
  });

  app.get("/api/study-plan", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        console.log("Unauthorized access attempt to study plan");
        return res.sendStatus(401);
      }

      console.log(`Generating study plan for user ${req.user.id}`);
      const analytics = await generateAdvancedAnalytics(req.user.id);
      const studyPlan = await generatePersonalizedStudyPlan(req.user.id, analytics.performanceMetrics);
      res.json(studyPlan);
    } catch (error) {
      console.error("Error generating study plan:", error);
      res.status(500).json({ error: "Failed to generate study plan" });
    }
  });

  // Update the mood route with better error handling
  app.post("/api/mood", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { mood } = req.body;
      if (!mood) {
        return res.status(400).json({ error: "Mood is required" });
      }
      const suggestion = await generateMoodSuggestion(mood);
      res.json({ suggestion });
    } catch (error: any) {
      console.error("Error processing mood:", error);
      res.status(500).json({ error: "Failed to process mood" });
    }
  });

  // Helper function to calculate quiz score
  function calculateScore(answers: { isCorrect: boolean }[]): number {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    return Math.round((correctAnswers / answers.length) * 100);
  }

  return httpServer;
}