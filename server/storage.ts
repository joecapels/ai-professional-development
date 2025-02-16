import { IStorage } from "./types";
import { User, StudyMaterial, Progress, InsertUser, InsertStudyMaterial, InsertProgress } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private materials: Map<number, StudyMaterial>;
  private progress: Map<number, Progress>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.materials = new Map();
    this.progress = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      isAdmin: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getMaterial(id: number): Promise<StudyMaterial | undefined> {
    return this.materials.get(id);
  }

  async getAllMaterials(): Promise<StudyMaterial[]> {
    return Array.from(this.materials.values());
  }

  async createMaterial(material: InsertStudyMaterial): Promise<StudyMaterial> {
    const id = this.currentId++;
    const studyMaterial: StudyMaterial = {
      ...material,
      id,
      createdAt: new Date(),
    };
    this.materials.set(id, studyMaterial);
    return studyMaterial;
  }

  async getProgressByUser(userId: number): Promise<Progress[]> {
    return Array.from(this.progress.values()).filter(p => p.userId === userId);
  }

  async createProgress(insertProgress: InsertProgress): Promise<Progress> {
    const id = this.currentId++;
    const { aiRecommendations, ...rest } = insertProgress;

    const newProgress: Progress = {
      ...rest,
      id,
      aiRecommendations: aiRecommendations ? [...aiRecommendations] : null,
      completedAt: new Date(),
    };

    this.progress.set(id, newProgress);
    return newProgress;
  }
}

export const storage = new MemStorage();