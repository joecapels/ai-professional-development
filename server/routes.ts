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

// Track active study sessions
const activeSessions = new Map<number, {
  ws: WebSocket;
  userId: number;
  sessionData: any;
}>();

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

// Add power user routes before the registerRoutes function
async function registerPowerUserRoutes(app: Express) {
  app.post("/api/power/login", async (req, res) => {
    const { username, password, powerKey } = req.body;

    // Verify power user key
    if (powerKey !== process.env.POWER_USER_KEY) {
      return res.status(401).json({ message: "Invalid power user key" });
    }

    // Authenticate user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set and store power user flag
    await storage.setPowerUserStatus(user.id, true);
    req.login({ ...user, isPowerUser: true }, (err) => {
      if (err) return res.status(500).json({ message: "Login failed" });
      res.json({ ...user, isPowerUser: true });
    });
  });

  app.get("/api/power/users/detailed", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isPowerUser) {
      return res.status(403).json({ message: "Power user access required" });
    }

    try {
      const users = await storage.getAllUsers();
      const sessions = await storage.getAllStudySessions();

      const userDetails = await Promise.all(users.map(async (user) => {
        const userSessions = sessions.filter(s => s.userId === user.id);
        const lastSession = userSessions[userSessions.length - 1];
        const totalSessionTime = userSessions.reduce((sum, session) => {
          return sum + (session.totalDuration || 0);
        }, 0);

        // In a real app, you would get these from your auth/session system
        const mockIpAddress = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        const mockLocations = ['San Francisco, US', 'New York, US', 'London, UK', 'Tokyo, JP'];
        const mockLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];

        return {
          id: user.id,
          username: user.username,
          subscriptionStatus: 'active', // Mock data - would come from subscription system
          ipAddress: mockIpAddress,
          lastActive: lastSession?.startTime || user.createdAt,
          totalSessions: userSessions.length,
          averageSessionLength: userSessions.length > 0 ? totalSessionTime / userSessions.length : 0,
          lastLoginLocation: mockLocation,
          createdAt: user.createdAt,
          sessions: userSessions.map(session => ({
            id: session.id,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.totalDuration || 0,
            status: session.status
          }))
        };
      }));

      res.json(userDetails);
    } catch (error) {
      console.error("Error fetching detailed user data:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  app.get("/api/power/analytics", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isPowerUser) {
      return res.status(403).json({ message: "Power user access required" });
    }

    try {
      // Get all users
      const users = await storage.getAllUsers();
      const quizResults = await storage.getAllQuizResults();
      const badges = await storage.getAllBadges();
      const achievements = await storage.getAllAchievements();
      const sessions = await storage.getAllStudySessions();

      // Calculate analytics
      const analytics = {
        userMetrics: {
          totalUsers: users.length,
          activeUsers: sessions.filter(s => s.status === 'active').length,
          newUsersToday: users.filter(u => {
            const created = new Date(u.createdAt);
            const today = new Date();
            return created.toDateString() === today.toDateString();
          }).length,
          userGrowth: calculateUserGrowth(users),
        },
        learningMetrics: {
          averageStudyTime: calculateAverageStudyTime(sessions),
          totalQuizzesTaken: quizResults.length,
          averageQuizScore: calculateAverageQuizScore(quizResults),
          subjectDistribution: calculateSubjectDistribution(quizResults),
        },
        achievementMetrics: {
          totalBadgesAwarded: achievements.length,
          popularBadges: calculatePopularBadges(achievements, badges),
          completionRates: calculateBadgeCompletionRates(achievements, badges, users.length),
        },
        engagementMetrics: {
          averageSessionLength: calculateAverageSessionLength(sessions),
          peakActivityHours: calculatePeakActivityHours(sessions),
          featureUsage: calculateFeatureUsage(sessions, quizResults),
        },
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ message: "Failed to generate analytics" });
    }
  });
}

// Helper functions for analytics calculations
function calculateUserGrowth(users: any[]) {
  const growth = users.reduce((acc, user) => {
    const date = new Date(user.createdAt).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(growth).map(([date, count]) => ({ date, count }));
}

function calculateAverageStudyTime(sessions: any[]) {
  if (sessions.length === 0) return 0;
  const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0);
  return Math.round(totalTime / sessions.length);
}

function calculateAverageQuizScore(results: any[]) {
  if (results.length === 0) return 0;
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  return Math.round(totalScore / results.length);
}

function calculateSubjectDistribution(quizResults: any[]) {
  return Object.entries(
    quizResults.reduce((acc, result) => {
      acc[result.subject] = (acc[result.subject] || 0) + 1;
      return acc;
    }, {})
  ).map(([subject, count]) => ({ subject, count }));
}

function calculatePopularBadges(achievements: any[], badges: any[]) {
  const badgeCounts = achievements.reduce((acc, achievement) => {
    acc[achievement.badgeId] = (acc[achievement.badgeId] || 0) + 1;
    return acc;
  }, {});

  return badges
    .map(badge => ({
      name: badge.name,
      count: badgeCounts[badge.id] || 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function calculateBadgeCompletionRates(achievements: any[], badges: any[], totalUsers: number) {
  return badges.map(badge => ({
    badge: badge.name,
    rate: (achievements.filter(a => a.badgeId === badge.id).length / totalUsers) * 100,
  }));
}

function calculateAverageSessionLength(sessions: any[]) {
  if (sessions.length === 0) return 0;
  const completedSessions = sessions.filter(s => s.status === 'completed');
  if (completedSessions.length === 0) return 0;
  const totalLength = completedSessions.reduce((sum, session) => sum + session.duration, 0);
  return Math.round(totalLength / completedSessions.length);
}

function calculatePeakActivityHours(sessions: any[]) {
  const hourCounts = sessions.reduce((acc, session) => {
    const hour = new Date(session.startTime).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourCounts[hour] || 0,
  }));
}

function calculateFeatureUsage(sessions: any[], quizResults: any[]) {
  return [
    { feature: 'Study Sessions', usage: sessions.length },
    { feature: 'Quizzes', usage: quizResults.length },
    // Add more features as needed
  ];
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
  await registerPowerUserRoutes(app);
  await registerBadgeRoutes(app); // Register the new badge routes.

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