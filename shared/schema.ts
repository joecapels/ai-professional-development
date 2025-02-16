import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStudyMaterialSchema = createInsertSchema(studyMaterials);
export const insertProgressSchema = createInsertSchema(progress);

export type User = typeof users.$inferSelect;
export type StudyMaterial = typeof studyMaterials.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudyMaterial = z.infer<typeof insertStudyMaterialSchema>;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
