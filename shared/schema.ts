import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Keep existing imports and type definitions

// Add content format types
export const contentFormat = [
  "text",
  "audio",
  "video",
  "interactive",
  "mixed"
] as const;

// Add content delivery preferences
export const contentDeliveryPreference = [
  "sequential",
  "parallel",
  "adaptive"
] as const;

// Add multimedia content table
export const multimodalContent = pgTable("multimodal_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  primaryFormat: text("primary_format").$type<typeof contentFormat[number]>().notNull(),
  content: json("content").$type<{
    text?: string;
    audioUrl?: string;
    videoUrl?: string;
    interactiveConfig?: Record<string, unknown>;
    transcripts?: { [key: string]: string };
  }>().notNull(),
  metadata: json("metadata").$type<{
    duration?: number;
    language?: string;
    accessibility?: {
      closedCaptions?: boolean;
      audioDescription?: boolean;
      textToSpeech?: boolean;
    };
    aiEnhancements?: {
      summary?: string;
      keyPoints?: string[];
      difficulty?: number;
    };
  }>(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Add content delivery preferences to user learning preferences
export type ExtendedLearningPreferences = {
  contentDelivery: typeof contentDeliveryPreference[number];
  preferredFormats: typeof contentFormat[number][];
  accessibilityNeeds?: {
    requiresClosedCaptions?: boolean;
    requiresAudioDescription?: boolean;
    requiresTextToSpeech?: boolean;
    highContrast?: boolean;
    fontSize?: number;
  };
} & z.infer<typeof learningPreferencesSchema>;

// Update users table with extended learning preferences
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  learningPreferences: json("learning_preferences").$type<ExtendedLearningPreferences>(),
});

// Add schemas for the new content type
export const insertMultimodalContentSchema = createInsertSchema(multimodalContent);
export type MultimodalContent = typeof multimodalContent.$inferSelect;
export type InsertMultimodalContent = z.infer<typeof insertMultimodalContentSchema>;

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

export const savedDocuments = pgTable("saved_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // "chat", "quiz", etc.
  metadata: json("metadata").$type<{
    subject?: string;
    aiPersonality?: string;
    timestamp?: string;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  totalDuration: integer("total_duration"), // in seconds
  breaks: json("breaks").$type<{
    startTime: string;
    endTime: string;
    duration: number;
  }[]>(),
  notes: text("notes"),
  metrics: json("metrics").$type<{
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
  documentIds: json("document_ids").$type<number[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  gradeLevel: z.enum(gradeLevel),
  researchAreas: z.array(z.enum(researchArea)).min(1),
});

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