import { User, StudyMaterial, Progress, Quiz, QuizResult, SavedDocument, InsertUser, InsertStudyMaterial, InsertProgress, InsertQuiz, InsertQuizResult, InsertDocument, Flashcard, InsertFlashcard } from "@shared/schema";
import type { Store } from "express-session";

export interface IStorage {
  sessionStore: Store;

  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getMaterial(id: number): Promise<StudyMaterial | undefined>;
  getAllMaterials(): Promise<StudyMaterial[]>;
  createMaterial(material: InsertStudyMaterial): Promise<StudyMaterial>;

  getProgressByUser(userId: number): Promise<Progress[]>;
  createProgress(progress: InsertProgress): Promise<Progress>;

  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzesByUser(userId: number): Promise<Quiz[]>;

  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getQuizResultsByUser(userId: number): Promise<QuizResult[]>;

  saveDocument(document: InsertDocument): Promise<SavedDocument>;
  getDocumentsByUser(userId: number): Promise<SavedDocument[]>;
  getDocument(id: number): Promise<SavedDocument | undefined>;

  // Add study session methods
  createStudySession(session: { userId: number; subject: string; status: string }): Promise<any>;
  getStudySession(id: number): Promise<any>;
  updateStudySessionStatus(sessionId: number, status: string): Promise<void>;
  updateStudySessionBreaks(sessionId: number, breakData: { startTime?: string; endTime?: string }): Promise<void>;
  updateStudySessionMetrics(sessionId: number, metrics: { focusScore?: number; completedTasks?: string[]; milestones?: string[] }): Promise<void>;
  completeStudySession(sessionId: number): Promise<void>;

  // Add flashcard methods
  getFlashcardsByUser(userId: number): Promise<Flashcard[]>;
  saveFlashcards(flashcards: (Omit<InsertFlashcard, "id">)[]): Promise<Flashcard[]>;
}