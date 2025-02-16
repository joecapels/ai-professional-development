import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { StudyMaterial, Progress } from "@shared/schema";
import { generateStudyRecommendations, generatePracticeQuestions } from "./openai.js";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Study materials routes
  app.get("/api/materials", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const materials = await storage.getAllMaterials();
    res.json(materials);
  });

  app.post("/api/materials", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(403);
    const material = await storage.createMaterial(req.body);
    res.json(material);
  });

  // Progress tracking routes
  app.get("/api/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const progress = await storage.getProgressByUser(req.user.id);
    res.json(progress);
  });

  app.post("/api/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const progress = await storage.createProgress({
      ...req.body,
      userId: req.user.id,
    });
    res.json(progress);
  });

  // AI recommendations route
  app.get("/api/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const progress = await storage.getProgressByUser(req.user.id);
    const recommendations = await generateStudyRecommendations(progress);
    res.json(recommendations);
  });

  // Practice questions route
  app.post("/api/practice", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { subject, difficulty } = req.body;
    const questions = await generatePracticeQuestions(subject, difficulty);
    res.json(questions);
  });

  const httpServer = createServer(app);
  return httpServer;
}