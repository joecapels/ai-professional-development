import { IStorage } from "./types";
import { User, StudyMaterial, Progress, InsertUser, InsertStudyMaterial, InsertProgress, LearningPreferences, Quiz, InsertQuiz, QuizResult, InsertQuizResult, SavedDocument, InsertDocument, Flashcard, InsertFlashcard, Badge, InsertBadge, UserAchievement, InsertUserAchievement } from "@shared/schema";
import { db, users, studyMaterials, progress, quizzes, quizResults, savedDocuments, studySessions, flashcards, badges, userAchievements } from "./db";
import { eq, desc } from "drizzle-orm";
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

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getMaterial(id: number): Promise<StudyMaterial | undefined> {
    const [material] = await db.select().from(studyMaterials).where(eq(studyMaterials.id, id));
    return material;
  }

  async getAllMaterials(): Promise<StudyMaterial[]> {
    return await db.select().from(studyMaterials);
  }

  async createMaterial(material: InsertStudyMaterial): Promise<StudyMaterial> {
    const [newMaterial] = await db.insert(studyMaterials).values(material).returning();
    return newMaterial;
  }

  async getProgressByUser(userId: number): Promise<Progress[]> {
    return await db.select().from(progress).where(eq(progress.userId, userId));
  }

  async createProgress(progressData: InsertProgress): Promise<Progress> {
    const [newProgress] = await db.insert(progress).values({
      material_id: progressData.materialId,
      score: progressData.score,
      user_id: progressData.userId,
      ai_recommendations: progressData.aiRecommendations || []
    }).returning();
    return newProgress;
  }

  async updateUserPreferences(userId: number, preferences: LearningPreferences): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ learningPreferences: preferences })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createQuiz(quizData: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values({
      subject: quizData.subject,
      difficulty: quizData.difficulty,
      user_id: quizData.userId,
      questions: quizData.questions || []
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
    const [newResult] = await db.insert(quizResults).values({
      quiz_id: resultData.quizId,
      score: resultData.score,
      user_id: resultData.userId,
      answers: resultData.answers || []
    }).returning();
    return newResult;
  }

  async getQuizResultsByUser(userId: number): Promise<QuizResult[]> {
    return await db.select().from(quizResults).where(eq(quizResults.userId, userId));
  }

  async saveDocument(document: InsertDocument): Promise<SavedDocument> {
    const [newDocument] = await db.insert(savedDocuments).values({
      title: document.title,
      content: document.content,
      type: document.type,
      user_id: document.userId,
      metadata: document.metadata || {}
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
    const [document] = await db
      .select()
      .from(savedDocuments)
      .where(eq(savedDocuments.id, id));
    return document;
  }

  async createStudySession(sessionData: { userId: number; subject: string; status: "active" | "paused" | "completed" }): Promise<any> {
    const [session] = await db.insert(studySessions).values({
      userId: sessionData.userId,
      subject: sessionData.subject,
      status: sessionData.status,
      startTime: new Date()
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

    const cardsToInsert = cards.map(card => ({
      front: card.front,
      back: card.back,
      difficulty: card.difficulty,
      user_id: card.userId,
      document_ids: card.documentIds || []
    }));

    return await db.insert(flashcards).values(cardsToInsert).returning();
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values({
      name: badge.name,
      description: badge.description,
      type: badge.type,
      rarity: badge.rarity,
      image_url: badge.imageUrl,
      criteria: badge.criteria || null,
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
    const [newAchievement] = await db.insert(userAchievements).values(achievement).returning();
    return newAchievement;
  }

  async updateAchievementProgress(
    userId: number,
    badgeId: number,
    progress: { current: number; target: number; lastUpdated: string }
  ): Promise<void> {
    await db
      .update(userAchievements)
      .set({ progress })
      .where(eq(userAchievements.userId, userId))
      .where(eq(userAchievements.badgeId, badgeId));
  }

  async getUserBadgeProgress(userId: number, badgeId: number): Promise<UserAchievement | undefined> {
    const [achievement] = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .where(eq(userAchievements.badgeId, badgeId));
    return achievement;
  }
}

export const storage = new DatabaseStorage();