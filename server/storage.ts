import { IStorage } from "./types";
import { User, StudyMaterial, Progress, InsertUser, InsertStudyMaterial, InsertProgress, LearningPreferences, Quiz, InsertQuiz, QuizResult, InsertQuizResult, SavedDocument, InsertDocument, Flashcard, InsertFlashcard, Badge, InsertBadge, UserAchievement, InsertUserAchievement } from "@shared/schema";
import { db, users, studyMaterials, progress, quizzes, quizResults, savedDocuments, studySessions, flashcards, badges, userAchievements } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'session'
    });
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const now = new Date();
    const [newUser] = await db.insert(users).values({
      ...userData,
      isAdmin: userData.isAdmin || false,
      createdAt: now,
      updatedAt: now,
      learningPreferences: userData.learningPreferences || {}
    }).returning();
    return newUser;
  }

  async updateUserPreferences(userId: number, preferences: LearningPreferences): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ learningPreferences: preferences })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getMaterial(id: number): Promise<StudyMaterial | undefined> {
    const [material] = await db.select().from(studyMaterials).where(eq(studyMaterials.id, id));
    return material;
  }

  async getAllMaterials(): Promise<StudyMaterial[]> {
    return await db.select().from(studyMaterials);
  }

  async createMaterial(material: InsertStudyMaterial): Promise<StudyMaterial> {
    const now = new Date();
    const [newMaterial] = await db.insert(studyMaterials).values({
      ...material,
      createdAt: now
    }).returning();
    return newMaterial;
  }

  async getProgressByUser(userId: number): Promise<Progress[]> {
    return await db.select().from(progress).where(eq(progress.userId, userId));
  }

  async createProgress(progressData: InsertProgress): Promise<Progress> {
    const now = new Date();
    const [newProgress] = await db.insert(progress).values({
      ...progressData,
      aiRecommendations: progressData.aiRecommendations || [],
      completedAt: now
    }).returning();
    return newProgress;
  }

  async createQuiz(quizData: InsertQuiz): Promise<Quiz> {
    const now = new Date();
    const [newQuiz] = await db.insert(quizzes).values({
      ...quizData,
      questions: quizData.questions || [],
      createdAt: now
    }).returning();
    return newQuiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuizzesByUser(userId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.userId, userId));
  }

  async createQuizResult(resultData: InsertQuizResult): Promise<QuizResult> {
    const now = new Date();
    const [newResult] = await db.insert(quizResults).values({
      ...resultData,
      answers: resultData.answers || [],
      completedAt: now
    }).returning();
    return newResult;
  }

  async getQuizResultsByUser(userId: number): Promise<QuizResult[]> {
    return await db.select().from(quizResults).where(eq(quizResults.userId, userId));
  }

  async saveDocument(document: InsertDocument): Promise<SavedDocument> {
    const now = new Date();
    const [newDocument] = await db.insert(savedDocuments).values({
      userId: document.userId,
      title: document.title,
      content: document.content,
      type: document.type,
      metadata: document.metadata || {},
      createdAt: now
    }).returning();
    return newDocument;
  }

  async getDocumentsByUser(userId: number): Promise<SavedDocument[]> {
    return await db
      .select()
      .from(savedDocuments)
      .where(eq(savedDocuments.userId, userId))
      .orderBy(desc(savedDocuments.createdAt));
  }

  async getDocument(id: number): Promise<SavedDocument | undefined> {
    const [document] = await db.select().from(savedDocuments).where(eq(savedDocuments.id, id));
    return document;
  }

  async createStudySession(sessionData: { userId: number; subject: string; status: "active" | "paused" | "completed" }): Promise<any> {
    const now = new Date();
    const [session] = await db.insert(studySessions).values({
      userId: sessionData.userId,
      subject: sessionData.subject,
      status: sessionData.status,
      startTime: now,
      endTime: null,
      totalDuration: 0,
      breaks: [],
      metrics: {}
    }).returning();
    return session;
  }

  async getStudySession(id: number): Promise<any> {
    const [session] = await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.id, id));
    return session;
  }

  async getStudySessionsByUser(userId: number) {
    return await db
      .select({
        id: studySessions.id,
        userId: studySessions.userId,
        subject: studySessions.subject,
        status: studySessions.status,
        startTime: studySessions.startTime,
        endTime: studySessions.endTime,
        totalDuration: studySessions.totalDuration,
        breaks: studySessions.breaks,
        metrics: studySessions.metrics
      })
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.startTime));
  }

  async getUserStudyStats(userId: number) {
    const studySessions = await this.getStudySessionsByUser(userId);
    const quizResults = await this.getQuizResultsByUser(userId);
    const documents = await this.getDocumentsByUser(userId);

    const totalStudyTime = studySessions.reduce((acc, session) => {
      return acc + (session.totalDuration || 0);
    }, 0);

    const avgSessionLength = studySessions.length > 0
      ? Math.round(totalStudyTime / studySessions.length)
      : 0;

    const quizStats = {
      totalQuizzes: quizResults.length,
      averageScore: quizResults.length > 0
        ? Math.round(quizResults.reduce((acc, quiz) => acc + quiz.score, 0) / quizResults.length)
        : 0,
      perfectScores: quizResults.filter(quiz => quiz.score === 100).length
    };

    const documentStats = {
      totalDocuments: documents.length,
      byType: documents.reduce((acc: Record<string, number>, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1;
        return acc;
      }, {}),
      recentActivity: documents
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    };

    let currentStreak = 0;
    let maxStreak = 0;
    let lastDate: Date | null = null;

    const orderedSessions = studySessions
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    orderedSessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      if (!lastDate ||
          (sessionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if ((sessionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) > 1) {
        currentStreak = 1;
      }
      lastDate = sessionDate;
    });

    return {
      totalStudyTime,
      avgSessionLength,
      totalSessions: studySessions.length,
      currentStreak,
      maxStreak,
      quizStats,
      documentStats,
      recentSessions: studySessions.slice(0, 5)
    };
  }

  async updateStudySessionStatus(sessionId: number, status: "active" | "paused" | "completed"): Promise<void> {
    await db
      .update(studySessions)
      .set({ status })
      .where(eq(studySessions.id, sessionId));
  }

  async updateStudySessionBreaks(
    sessionId: number,
    breakData: { startTime?: string; endTime?: string }
  ): Promise<void> {
    const session = await this.getStudySession(sessionId);
    const breaks = session.breaks || [];

    if (breakData.startTime) {
      breaks.push({
        startTime: breakData.startTime,
        endTime: null,
        duration: 0,
      });
    } else if (breakData.endTime) {
      const lastBreak = breaks[breaks.length - 1];
      if (lastBreak && !lastBreak.endTime) {
        lastBreak.endTime = breakData.endTime;
        lastBreak.duration =
          (new Date(breakData.endTime).getTime() - new Date(lastBreak.startTime).getTime()) / 1000;
      }
    }

    await db
      .update(studySessions)
      .set({ breaks })
      .where(eq(studySessions.id, sessionId));
  }

  async updateStudySessionMetrics(
    sessionId: number,
    metrics: { focusScore?: number; completedTasks?: string[]; milestones?: string[] }
  ): Promise<void> {
    await db
      .update(studySessions)
      .set({ metrics })
      .where(eq(studySessions.id, sessionId));
  }

  async completeStudySession(sessionId: number): Promise<void> {
    const endTime = new Date();
    const session = await this.getStudySession(sessionId);

    if (!session) return;

    const startTime = new Date(session.startTime);
    const totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    await db
      .update(studySessions)
      .set({
        status: 'completed' as const,
        endTime,
        totalDuration,
      })
      .where(eq(studySessions.id, sessionId));
  }

  async getFlashcardsByUser(userId: number): Promise<Flashcard[]> {
    return await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.userId, userId))
      .orderBy(desc(flashcards.createdAt));
  }

  async saveFlashcards(cards: (InsertFlashcard & { userId: number })[]): Promise<Flashcard[]> {
    if (cards.length === 0) return [];

    const now = new Date();
    const cardsToInsert = cards.map(card => ({
      userId: card.userId,
      front: card.front,
      back: card.back,
      difficulty: card.difficulty,
      documentIds: card.documentIds || [],
      createdAt: now
    }));

    return await db.insert(flashcards).values(cardsToInsert).returning();
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const now = new Date();
    const [newBadge] = await db.insert(badges).values({
      name: badge.name,
      description: badge.description,
      type: badge.type,
      rarity: badge.rarity,
      imageUrl: badge.imageUrl,
      criteria: badge.criteria || null,
      createdAt: now
    }).returning();
    return newBadge;
  }

  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
  }

  async awardBadge(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const now = new Date();
    const [newAchievement] = await db.insert(userAchievements).values({...achievement, earnedAt: now}).returning();
    return newAchievement;
  }

  async updateAchievementProgress(
    userId: number,
    badgeId: number,
    progress: { current: number; target: number; lastUpdated: string }
  ): Promise<void> {
    const now = new Date();
    await db
      .update(userAchievements)
      .set({ progress: {...progress, lastUpdated: now} })
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.badgeId, badgeId)
      ));
  }

  async getUserBadgeProgress(userId: number, badgeId: number): Promise<UserAchievement | undefined> {
    const [achievement] = await db
      .select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.badgeId, badgeId)
      ));
    return achievement;
  }

  async createInitialBadges(): Promise<void> {
    const initialBadges = [
      {
        name: "Quick Learner",
        description: "Complete your first study session",
        type: "quick_learner",
        rarity: "common",
        imageUrl: "/badges/quick-learner.svg",
        criteria: {
          type: "study_sessions",
          threshold: 1
        }
      },
      {
        name: "Quiz Master",
        description: "Score 100% on 3 quizzes",
        type: "quiz_master",
        rarity: "rare",
        imageUrl: "/badges/quiz-master.svg",
        criteria: {
          type: "perfect_quizzes",
          threshold: 3
        }
      },
      {
        name: "Knowledge Explorer",
        description: "Study 5 different subjects",
        type: "knowledge_explorer",
        rarity: "uncommon",
        imageUrl: "/badges/knowledge-explorer.svg",
        criteria: {
          type: "unique_subjects",
          threshold: 5
        }
      },
      {
        name: "Study Streak",
        description: "Study for 7 consecutive days",
        type: "study_streak",
        rarity: "epic",
        imageUrl: "/badges/study-streak.svg",
        criteria: {
          type: "consecutive_days",
          threshold: 7
        }
      }
    ];

    for (const badge of initialBadges) {
      const existingBadge = await db
        .select()
        .from(badges)
        .where(eq(badges.name, badge.name));

      if (!existingBadge.length) {
        await this.createBadge(badge);
      }
    }
  }

  async checkAndAwardBadges(userId: number): Promise<void> {
    const allBadges = await this.getAllBadges();

    for (const badge of allBadges) {
      const existingAchievement = await this.getUserBadgeProgress(userId, badge.id);
      if (existingAchievement?.progress?.current && badge.criteria?.threshold && 
          existingAchievement.progress.current >= badge.criteria.threshold) {
        continue;
      }

      let progress = { 
        current: 0, 
        target: badge.criteria?.threshold || 0, 
        lastUpdated: new Date().toISOString() 
      };

      switch (badge.type) {
        case "quick_learner": {
          const sessions = await db
            .select()
            .from(studySessions)
            .where(eq(studySessions.userId, userId));
          progress.current = sessions.length;
          break;
        }
        case "quiz_master": {
          const results = await db
            .select()
            .from(quizResults)
            .where(and(
              eq(quizResults.userId, userId),
              eq(quizResults.score, 100)
            ));
          progress.current = results.length;
          break;
        }
        case "knowledge_explorer": {
          const uniqueSubjects = await db
            .select({ subject: studySessions.subject })
            .from(studySessions)
            .where(eq(studySessions.userId, userId))
            .groupBy(studySessions.subject);
          progress.current = uniqueSubjects.length;
          break;
        }
        case "study_streak": {
          const sessions = await db
            .select({ date: studySessions.startTime })
            .from(studySessions)
            .where(eq(studySessions.userId, userId))
            .orderBy(studySessions.startTime);

          let streak = 0;
          let currentStreak = 0;
          let lastDate: Date | null = null;

          sessions.forEach(({ date }) => {
            const sessionDate = new Date(date);
            if (!lastDate ||
                (sessionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) === 1) {
              currentStreak++;
            } else {
              currentStreak = 1;
            }
            streak = Math.max(streak, currentStreak);
            lastDate = sessionDate;
          });

          progress.current = streak;
          break;
        }
      }

      if (!existingAchievement) {
        await this.awardBadge({
          userId,
          badgeId: badge.id,
          progress
        });
      } else if (progress.current > (existingAchievement.progress?.current || 0)) {
        await this.updateAchievementProgress(userId, badge.id, progress);
      }
    }
  }
}

export const storage = new DatabaseStorage();