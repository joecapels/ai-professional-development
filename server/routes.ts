interface StudySessionData {
  ws: WebSocket;
  userId: number;
  sessionData: any; // This can be more specific based on your session data structure
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { StudyMaterial, Progress, type LearningPreferences, type StudySessionMessage, studySessionMessageSchema } from "@shared/schema";
import { generateStudyRecommendations, generatePracticeQuestions, handleStudyChat, generateMoodSuggestion, generateFlashcardsFromContent } from "./openai";
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

// Track active study sessions with proper typing
const activeSessions = new Map<number, StudySessionData>();

// Add new routes before the registerRoutes function

// Badge management routes
async function registerBadgeRoutes(app: Express) {
  app.get("/api/badges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const badges = await storage.getAllBadges();
    res.json(badges);
  });

  app.post("/api/badges", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    try {
      const badge = await storage.createBadge(req.body);
      res.json(badge);
    } catch (error) {
      console.error("Error creating badge:", error);
      res.status(500).json({ error: "Failed to create badge" });
    }
  });

  // User achievement routes
  app.get("/api/achievements", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const achievements = await storage.getUserAchievements(req.user.id);
      const achievementsWithBadges = await Promise.all(
        achievements.map(async (achievement) => {
          const badge = await storage.getBadge(achievement.badgeId);
          return { ...achievement, badge };
        })
      );
      res.json(achievementsWithBadges);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.post("/api/achievements/:badgeId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const badgeId = parseInt(req.params.badgeId);
      const badge = await storage.getBadge(badgeId);

      if (!badge) {
        return res.status(404).json({ error: "Badge not found" });
      }

      // Check if user already has this badge
      const existingAchievement = await storage.getUserBadgeProgress(req.user.id, badgeId);
      if (existingAchievement) {
        return res.status(400).json({ error: "Badge already awarded" });
      }

      const achievement = await storage.awardBadge({
        userId: req.user.id,
        badgeId,
        progress: {
          current: 0,
          target: badge.criteria?.threshold || 1,
          lastUpdated: new Date().toISOString()
        }
      });

      res.json(achievement);
    } catch (error) {
      console.error("Error awarding badge:", error);
      res.status(500).json({ error: "Failed to award badge" });
    }
  });

  // Update achievement progress
  app.patch("/api/achievements/:badgeId/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const badgeId = parseInt(req.params.badgeId);
      const { current, target } = req.body;

      await storage.updateAchievementProgress(req.user.id, badgeId, {
        current,
        target,
        lastUpdated: new Date().toISOString()
      });

      res.sendStatus(200);
    } catch (error) {
      console.error("Error updating achievement progress:", error);
      res.status(500).json({ error: "Failed to update achievement progress" });
    }
  });
}

// Add admin-specific routes before the registerRoutes function
async function registerAdminRoutes(app: Express) {
  // Fetch all users (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(403);
    }
    try {
      const users = await storage.getAllUsers();
      // Remove sensitive information
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin analytics
  interface UserStats {
    chatCount: number;
    quizCount: number;
    studySessionCount: number;
    averageSessionDuration: number;
    totalDocuments: number;
    totalFlashcards: number;
    achievements: number;
    lastLogin: string | null;
    totalLogins: number;
    sessionHistory: {
      startTime: string;
      endTime: string | null;
      duration: number;
    }[];
    chatHistory: {
      timestamp: string;
      type: string;
    }[];
  }

  interface AdminAnalytics {
    activeSessions: number;
    totalAchievements: number;
    totalUsers: number;
    userStats: Record<number, UserStats>;
    aggregateStats: {
      totalSessions: number;
      activeUsers24h: number;
      averageSessionDuration: number;
      totalDocuments: number;
      totalFlashcards: number;
      totalChats: number;
      userEngagement: {
        daily: number;
        weekly: number;
        monthly: number;
      };
    };
  }

  app.get("/api/admin/analytics", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(403);
    }
    try {
      // Get active study sessions count
      const activeSessionsCount = activeSessions.size;

      // Get all users and their data
      const users = await storage.getAllUsers();
      let totalAchievements = 0;
      const userStats: Record<number, UserStats> = {};
      let aggregateStats = {
        totalSessions: 0,
        activeUsers24h: 0,
        averageSessionDuration: 0,
        totalDocuments: 0,
        totalFlashcards: 0,
        totalChats: 0,
        userEngagement: {
          daily: 0,
          weekly: 0,
          monthly: 0
        }
      };

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Collect statistics for each user
      for (const user of users) {
        // Get achievements
        const achievements = await storage.getUserAchievements(user.id);
        const achievementCount = achievements.length;
        totalAchievements += achievementCount;

        // Get study sessions
        const studySessions = await storage.getStudySessionsByUser(user.id);
        const sessionCount = studySessions.length;
        const sessionDuration = studySessions.reduce((acc, session) =>
          acc + (session.totalDuration || 0), 0);

        // Get session history
        const sessionHistory = studySessions.map(session => ({
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.totalDuration || 0
        }));

        // Check recent activity
        const hasRecentActivity = sessionHistory.some(
          session => new Date(session.startTime) > last24h
        );
        if (hasRecentActivity) {
          aggregateStats.activeUsers24h++;
        }

        // Calculate engagement periods
        const hasActivityInPeriod = (date: Date) =>
          sessionHistory.some(session => new Date(session.startTime) > date);

        if (hasActivityInPeriod(last24h)) aggregateStats.userEngagement.daily++;
        if (hasActivityInPeriod(lastWeek)) aggregateStats.userEngagement.weekly++;
        if (hasActivityInPeriod(lastMonth)) aggregateStats.userEngagement.monthly++;

        // Get quizzes
        const quizzes = await storage.getQuizzesByUser(user.id);
        const quizCount = quizzes.length;

        // Get documents
        const documents = await storage.getDocumentsByUser(user.id);
        const documentCount = documents.length;

        // Get flashcards
        const flashcards = await storage.getFlashcardsByUser(user.id);
        const flashcardCount = flashcards.length;

        // Store individual user stats
        userStats[user.id] = {
          chatCount: 0, // This will be implemented when chat history is available
          quizCount,
          studySessionCount: sessionCount,
          averageSessionDuration: sessionCount > 0 ? Math.round(sessionDuration / sessionCount) : 0,
          totalDocuments: documentCount,
          totalFlashcards: flashcardCount,
          achievements: achievementCount,
          lastLogin: sessionHistory[0]?.startTime || null,
          totalLogins: sessionHistory.length,
          sessionHistory,
          chatHistory: [] // This will be populated when chat system is implemented
        };

        // Update aggregate stats
        aggregateStats.totalSessions += sessionCount;
        aggregateStats.totalDocuments += documentCount;
        aggregateStats.totalFlashcards += flashcardCount;
        aggregateStats.averageSessionDuration += sessionDuration;
      }

      // Calculate final averages
      if (users.length > 0) {
        aggregateStats.averageSessionDuration = Math.round(
          aggregateStats.averageSessionDuration / aggregateStats.totalSessions
        );
      }

      const analyticsData: AdminAnalytics = {
        activeSessions: activeSessionsCount,
        totalAchievements,
        totalUsers: users.length,
        userStats,
        aggregateStats
      };

      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Individual user stats endpoint
  app.get("/api/admin/user-stats/:userId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.sendStatus(403);
    }

    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const studySessions = await storage.getStudySessionsByUser(userId);
      const achievements = await storage.getUserAchievements(userId);
      const quizzes = await storage.getQuizzesByUser(userId);
      const documents = await storage.getDocumentsByUser(userId);
      const flashcards = await storage.getFlashcardsByUser(userId);

      const sessionHistory = studySessions.map(session => ({
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.totalDuration || 0,
        subject: session.subject,
        status: session.status
      }));

      const userStats = {
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt
        },
        studyStats: {
          totalSessions: studySessions.length,
          totalStudyTime: studySessions.reduce((acc, session) =>
            acc + (session.totalDuration || 0), 0),
          averageSessionDuration: studySessions.length > 0
            ? Math.round(studySessions.reduce((acc, session) =>
                acc + (session.totalDuration || 0), 0) / studySessions.length)
            : 0,
          sessionHistory
        },
        achievements: {
          total: achievements.length,
          list: achievements
        },
        quizStats: {
          totalQuizzes: quizzes.length,
          averageScore: quizzes.length > 0
            ? Math.round(quizzes.reduce((acc, quiz) => acc + (quiz.score || 0), 0) / quizzes.length)
            : 0
        },
        contentStats: {
          documents: {
            total: documents.length,
            byType: documents.reduce((acc: Record<string, number>, doc) => {
              acc[doc.type] = (acc[doc.type] || 0) + 1;
              return acc;
            }, {})
          },
          flashcards: {
            total: flashcards.length,
            byDifficulty: flashcards.reduce((acc: Record<string, number>, card) => {
              acc[card.difficulty] = (acc[card.difficulty] || 0) + 1;
              return acc;
            }, {})
          }
        }
      };

      res.json(userStats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Update the session middleware configuration for better security
  const sessionMiddleware = session({
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      httpOnly: true,
    },
    name: 'sid', // Set a specific cookie name
  });

  // Add security headers middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.use(sessionMiddleware);
  setupAuth(app);
  const httpServer = createServer(app);

  // Set up WebSocket server with session handling
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    verifyClient: (info, callback) => {
      console.log("WebSocket connection attempt");
      // Apply session middleware to WebSocket upgrade request
      sessionMiddleware(info.req as any, {} as any, () => {
        const req = info.req as WebSocketRequestWithSession;
        console.log("Session data:", req.session);
        if (!req.session?.passport?.user) {
          console.log("WebSocket authentication failed - no user in session");
          callback(false, 401, 'Unauthorized');
          return;
        }
        console.log("WebSocket authentication successful for user:", req.session.passport.user);
        callback(true);
      });
    }
  });

  wss.on('connection', async (ws: WebSocket, req: WebSocketRequestWithSession) => {
    if (!req.session?.passport?.user) {
      console.log("WebSocket connection attempt without authentication");
      ws.close(1008, 'Authentication required');
      return;
    }

    const userId = req.session.passport.user;
    console.log(`WebSocket authenticated for user ${userId}`);

    // Add error handling for the WebSocket connection
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      try {
        ws.close(1011, 'Internal server error');
      } catch (e) {
        console.error('Error while closing WebSocket connection:', e);
      }
    });

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const validatedMessage = studySessionMessageSchema.parse(message);

        switch (validatedMessage.type) {
          case 'start': {
            try {
              const session = await storage.createStudySession({
                userId,
                subject: validatedMessage.data?.subject || 'General',
                status: 'active',
              });
              activeSessions.set(session.id, { ws, userId, sessionData: session });
              ws.send(JSON.stringify({ type: 'session_started', sessionId: session.id }));
            } catch (error) {
              console.error('Error starting study session:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to start study session',
                details: process.env.NODE_ENV === 'development' ? error : undefined
              }));
            }
            break;
          }

          case 'pause':
          case 'resume': {
            await storage.updateStudySessionStatus(validatedMessage.sessionId,
              validatedMessage.type === 'pause' ? 'paused' : 'active');
            ws.send(JSON.stringify({
              type: `session_${validatedMessage.type}d`,
              sessionId: validatedMessage.sessionId
            }));
            break;
          }

          case 'break_start':
          case 'break_end': {
            await storage.updateStudySessionBreaks(validatedMessage.sessionId, {
              startTime: validatedMessage.type === 'break_start' ? new Date().toISOString() : undefined,
              endTime: validatedMessage.type === 'break_end' ? new Date().toISOString() : undefined,
            });
            ws.send(JSON.stringify({
              type: validatedMessage.type === 'break_start' ? 'break_started' : 'break_ended',
              sessionId: validatedMessage.sessionId
            }));
            break;
          }

          case 'end': {
            await storage.completeStudySession(validatedMessage.sessionId);
            activeSessions.delete(validatedMessage.sessionId);
            ws.send(JSON.stringify({
              type: 'session_ended',
              sessionId: validatedMessage.sessionId
            }));
            break;
          }

          case 'update_metrics': {
            if (validatedMessage.data?.metrics) {
              await storage.updateStudySessionMetrics(
                validatedMessage.sessionId,
                validatedMessage.data.metrics
              );
              ws.send(JSON.stringify({
                type: 'metrics_updated',
                sessionId: validatedMessage.sessionId
              }));
            }
            break;
          }
        }
      } catch (error: any) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }));
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket connection closed for user ${userId}`);
      // Clean up any active sessions for this connection
      for (const [sessionId, session] of Array.from(activeSessions.entries())) {
        if (session.ws === ws) {
          storage.completeStudySession(sessionId).catch(err => {
            console.error(`Error completing session ${sessionId}:`, err);
          });
          activeSessions.delete(sessionId);
        }
      }
    });

    // Send initial connection success message
    ws.send(JSON.stringify({ type: 'connected', userId }));
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
    try {
      const progress = await storage.createProgress({
        ...req.body,
        userId: req.user.id,
      });

      // Check and update badges after progress is recorded
      await storage.checkAndAwardBadges(req.user.id);

      res.json(progress);
    } catch (error) {
      console.error("Error creating progress:", error);
      res.status(500).json({ error: "Failed to create progress" });
    }
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
    try {
      const result = await storage.createQuizResult({
        ...req.body,
        userId: req.user.id,
        score: calculateScore(req.body.answers),
      });

      // Check and update badges after quiz completion
      await storage.checkAndAwardBadges(req.user.id);

      res.json(result);
    } catch (error) {
      console.error("Error creating quiz result:", error);
      res.status(500).json({ error: "Failed to create quiz result" });
    }
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

  // Flashcard routes
  app.get("/api/flashcards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const flashcards = await storage.getFlashcardsByUser(req.user.id);
    res.json(flashcards);
  });

  app.post("/api/flashcards/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { documentIds } = req.body;

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({ error: "Document IDs are required" });
      }

      // Fetch the documents content
      const documents = await Promise.all(
        documentIds.map(id => storage.getDocument(id))
      );

      // Filter out any null results and documents that don't belong to the user
      const validDocuments = documents.filter(
        doc => doc && doc.userId === req.user.id
      );

      if (validDocuments.length === 0) {
        return res.status(404).json({ error: "No valid documents found" });
      }

      // Combine all document content for processing
      const combinedContent = validDocuments
        .map(doc => doc?.content ?? '')
        .filter(content => content !== '')
        .join("\n\n");

      // Generate flashcards using OpenAI
      const flashcards = await generateFlashcardsFromContent(combinedContent);

      // Save the generated flashcards
      const savedFlashcards = await storage.saveFlashcards(
        flashcards.map(card => ({
          ...card,
          userId: req.user.id,
          documentIds: documentIds,
        }))
      );

      res.json(savedFlashcards);
    } catch (error: any) {
      console.error("Error generating flashcards:", error);
      res.status(500).json({ error: "Failed to generate flashcards" });
    }
  });

  await registerBadgeRoutes(app);
  await registerAdminRoutes(app); // Register the new admin routes

  // Study session completion with badge check
  app.post("/api/study-sessions/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.completeStudySession(parseInt(req.params.id));

      // Check and update badges after session completion
      await storage.checkAndAwardBadges(req.user.id);

      res.sendStatus(200);
    } catch (error) {
      console.error("Error completing study session:", error);
      res.status(500).json({ error: "Failed to complete study session" });
    }
  });

  // Helper function to calculate quiz score
  function calculateScore(answers: { isCorrect: boolean }[]): number {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    return Math.round((correctAnswers / answers.length) * 100);
  }

  // Add study stats route
  app.get("/api/study-stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const stats = await storage.getUserStudyStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching study stats:", error);
      res.status(500).json({ error: "Failed to fetch study statistics" });
    }
  });

  return httpServer;
}