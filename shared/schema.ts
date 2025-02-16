import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  learningPreferences: json("learning_preferences").$type<{
    learningStyle: "visual" | "auditory" | "reading" | "kinesthetic";
    pacePreference: "fast" | "moderate" | "slow";
    explanationDetail: "basic" | "detailed" | "comprehensive";
    exampleFrequency: "few" | "moderate" | "many";
    chatbotPersonality: "encouraging" | "socratic" | "professional" | "friendly";
  }>(),
});

export const studyMaterials = pgTable("study_materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  subject: text("subject").notNull(),
  difficulty: integer("difficulty").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  materialId: integer("material_id").notNull().references(() => studyMaterials.id),
  score: integer("score").notNull(),
  aiRecommendations: json("ai_recommendations").$type<string[]>(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  difficulty: integer("difficulty").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  questions: json("questions").$type<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[]>(),
});

export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  answers: json("answers").$type<{
    questionIndex: number;
    selectedAnswer: string;
    isCorrect: boolean;
  }[]>(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const learningPreferencesSchema = z.object({
  learningStyle: z.enum(["visual", "auditory", "reading", "kinesthetic"]),
  pacePreference: z.enum(["fast", "moderate", "slow"]),
  explanationDetail: z.enum(["basic", "detailed", "comprehensive"]),
  exampleFrequency: z.enum(["few", "moderate", "many"]),
  chatbotPersonality: z.enum(["encouraging", "socratic", "professional", "friendly"]),
});

export const insertStudyMaterialSchema = createInsertSchema(studyMaterials);
export const insertProgressSchema = createInsertSchema(progress);
export const insertQuizSchema = createInsertSchema(quizzes);
export const insertQuizResultSchema = createInsertSchema(quizResults);

export type User = typeof users.$inferSelect;
export type StudyMaterial = typeof studyMaterials.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudyMaterial = z.infer<typeof insertStudyMaterialSchema>;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type LearningPreferences = z.infer<typeof learningPreferencesSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;