import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define constants first
export const gradeLevel = [
  "elementary_1_3",
  "elementary_4_6",
  "middle_school",
  "high_school",
  "undergraduate",
  "masters",
  "phd",
  "professional"
] as const;

export const researchArea = [
  // Sciences
  "biology",
  "chemistry",
  "physics",
  "environmental_science",
  // Technology & Computing
  "computer_science",
  "artificial_intelligence",
  "data_science",
  "robotics",
  // Mathematics
  "mathematics",
  "statistics",
  "algebra",
  "calculus",
  // Social Sciences
  "psychology",
  "sociology",
  "economics",
  "political_science",
  // Humanities
  "history",
  "philosophy",
  "literature",
  "linguistics",
  // Arts
  "visual_arts",
  "music",
  "performing_arts",
  "design",
  // Health & Medicine
  "medicine",
  "anatomy",
  "public_health",
  "nutrition",
  // Business
  "business",
  "marketing",
  "finance",
  "management",
  // Other Fields
  "education",
  "engineering",
  "architecture",
  "law"
] as const;

// Add badge types
export const badgeType = [
  "quick_learner",
  "study_streak",
  "quiz_master",
  "perfect_score",
  "milestone_achiever",
  "knowledge_explorer",
  "consistent_learner",
  "subject_expert",
  "early_bird",
  "night_owl"
] as const;

// Add badge rarity levels
export const badgeRarity = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary"
] as const;

// Add badges table
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").$type<typeof badgeType[number]>().notNull(),
  rarity: text("rarity").$type<typeof badgeRarity[number]>().notNull(),
  imageUrl: text("image_url").notNull(),
  criteria: jsonb("criteria").$type<{
    type: string;
    threshold: number;
    timeframe?: number; // in days
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Add user achievements table
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  progress: jsonb("progress").$type<{
    current: number;
    target: number;
    lastUpdated: string;
  }>(),
});

// Keep existing table definitions
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  country: text("country"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  learningPreferences: jsonb("learning_preferences").$type<z.infer<typeof learningPreferencesSchema>>().default({
    learningStyle: "visual",
    pacePreference: "moderate",
    explanationDetail: "detailed",
    exampleFrequency: "moderate",
    chatbotPersonality: "encouraging",
    gradeLevel: "high_school",
    researchAreas: ["computer_science"]
  })
});

export const studyMaterials = pgTable("study_materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  subject: text("subject").notNull(),
  difficulty: integer("difficulty").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  materialId: integer("material_id").notNull().references(() => studyMaterials.id),
  score: integer("score").notNull(),
  aiRecommendations: jsonb("ai_recommendations").$type<string[]>(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  difficulty: integer("difficulty").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  questions: jsonb("questions").$type<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[]>(),
});

// Update the quiz results table definition
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull().default(10),
  subject: text("subject").notNull().default("General"),
  answers: jsonb("answers").$type<{
    questionIndex: number;
    selectedAnswer: string;
    isCorrect: boolean;
  }[]>().default([]),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const savedDocuments = pgTable("saved_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // "chat", "quiz", etc.
  metadata: jsonb("metadata").$type<{
    subject?: string;
    aiPersonality?: string;
    timestamp?: string;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Add study session related types and schemas
export const studySessionStatus = [
  "active",
  "paused",
  "completed"
] as const;

export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  status: text("status").$type<typeof studySessionStatus[number]>().notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull().defaultNow(),
  endTime: timestamp("end_time", { withTimezone: true }),
  totalDuration: integer("total_duration"), // in seconds
  breaks: jsonb("breaks").$type<{
    startTime: string;
    endTime: string;
    duration: number;
  }[]>(),
  notes: text("notes"),
  metrics: jsonb("metrics").$type<{
    focusScore?: number;
    completedTasks?: string[];
    milestones?: string[];
  }>(),
});

// Add flashcards table
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  front: text("front").notNull(),
  back: text("back").notNull(),
  difficulty: integer("difficulty").notNull(),
  documentIds: jsonb("document_ids").$type<number[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Update the insert schema to include new fields
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phoneNumber: true,
  country: true,
}).extend({
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  country: z.string().min(2, "Please select a country"),
});

export const learningPreferencesSchema = z.object({
  learningStyle: z.enum(["visual", "auditory", "reading", "kinesthetic"]),
  pacePreference: z.enum(["fast", "moderate", "slow"]),
  explanationDetail: z.enum(["basic", "detailed", "comprehensive"]),
  exampleFrequency: z.enum(["few", "moderate", "many"]),
  chatbotPersonality: z.enum(["encouraging", "socratic", "professional", "friendly"]),
  gradeLevel: z.enum(gradeLevel),
  researchAreas: z.array(z.enum(researchArea)).min(1)
}).strict();

export const insertStudyMaterialSchema = createInsertSchema(studyMaterials);
export const insertProgressSchema = createInsertSchema(progress);
export const insertQuizSchema = createInsertSchema(quizzes);
export const insertQuizResultSchema = createInsertSchema(quizResults);
export const insertDocumentSchema = createInsertSchema(savedDocuments);

// Add to existing export types
export const insertStudySessionSchema = createInsertSchema(studySessions);
export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;

// Add flashcard schema
export const insertFlashcardSchema = createInsertSchema(flashcards);
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;


// Add new schemas
export const insertBadgeSchema = createInsertSchema(badges);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);

// Add new types
export type Badge = typeof badges.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Keep existing types and exports
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
export type SavedDocument = typeof savedDocuments.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;


// WebSocket message types
export const studySessionMessageSchema = z.object({
  type: z.enum(["start", "pause", "resume", "end", "break_start", "break_end", "update_metrics"]),
  sessionId: z.number(),
  timestamp: z.string(),
  data: z.object({
    subject: z.string().optional(),
    duration: z.number().optional(),
    metrics: z.object({
      focusScore: z.number().optional(),
      completedTasks: z.array(z.string()).optional(),
      milestones: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
});

export type StudySessionMessage = z.infer<typeof studySessionMessageSchema>;

// Add session table definition to prevent it from being dropped
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});