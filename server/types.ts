import { User, StudyMaterial, Progress, Quiz, QuizResult, InsertUser, InsertStudyMaterial, InsertProgress, InsertQuiz, InsertQuizResult } from "@shared/schema";
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

  // Add new quiz-related methods
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzesByUser(userId: number): Promise<Quiz[]>;

  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getQuizResultsByUser(userId: number): Promise<QuizResult[]>;
}