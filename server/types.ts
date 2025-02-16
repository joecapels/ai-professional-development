import { User, StudyMaterial, Progress, InsertUser, InsertStudyMaterial, InsertProgress } from "@shared/schema";
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
}
