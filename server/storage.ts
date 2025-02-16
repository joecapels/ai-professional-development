import { IStorage } from "./types";
import { User, StudyMaterial, Progress, InsertUser, InsertStudyMaterial, InsertProgress } from "@shared/schema";
import { db, users, studyMaterials, progress } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
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

  async createProgress(insertProgress: InsertProgress): Promise<Progress> {
    const [newProgress] = await db.insert(progress).values(insertProgress).returning();
    return newProgress;
  }
}

export const storage = new DatabaseStorage();