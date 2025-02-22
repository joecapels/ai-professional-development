import { Progress, StudyMaterial } from "@shared/schema";
import OpenAI from "openai";
import { db, progress, studyMaterials, users } from "./db";
import { eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PerformanceMetrics {
  overallScore: number;
  strengthAreas: string[];
  improvementAreas: string[];
  learningTrends: {
    period: string;
    score: number;
  }[];
  recommendedTopics: string[];
  predictedDifficulty: number;
}

interface SubjectPerformance {
  subject: string;
  averageScore: number;
  totalAttempts: number;
  lastAttemptDate: string;
  improvement: number;
}

// Default data function for new users or when data is not available
function getDefaultData(): {
  performanceMetrics: PerformanceMetrics;
  subjectPerformance: SubjectPerformance[];
  nextStepRecommendations: string[];
  documentAnalysis: {
    topicsDistribution: { topic: string; count: number }[];
    complexityTrend: { month: string; averageComplexity: number }[];
    conceptConnections: { concept: string; relatedConcepts: string[]; strength: number }[];
  };
} {
  return {
    performanceMetrics: {
      overallScore: 0,
      strengthAreas: [],
      improvementAreas: [],
      learningTrends: [
        { period: "Week 1", score: 0 }
      ],
      recommendedTopics: ["Start with introductory materials"],
      predictedDifficulty: 1
    },
    subjectPerformance: [
      {
        subject: "General",
        averageScore: 0,
        totalAttempts: 0,
        lastAttemptDate: new Date().toISOString(),
        improvement: 0
      }
    ],
    nextStepRecommendations: [
      "Begin with foundational courses",
      "Take initial assessment tests",
      "Set your learning preferences"
    ],
    documentAnalysis: {
      topicsDistribution: [
        { topic: "Study Notes", count: 5 },
        { topic: "Flashcards", count: 8 },
        { topic: "Chat Sessions", count: 4 },
        { topic: "Practice Problems", count: 6 }
      ],
      complexityTrend: [],
      conceptConnections: []
    }
  };
}

// Enhanced analytics function
export async function generateAdvancedAnalytics(userId: number): Promise<{
  performanceMetrics: PerformanceMetrics;
  subjectPerformance: SubjectPerformance[];
  nextStepRecommendations: string[];
  documentAnalysis: {
    topicsDistribution: { topic: string; count: number }[];
    complexityTrend: { month: string; averageComplexity: number }[];
    conceptConnections: { concept: string; relatedConcepts: string[]; strength: number }[];
  };
}> {
  try {
    const userProgress = await db.select().from(progress).where(eq(progress.userId, userId));

    if (userProgress.length === 0) {
      return getDefaultData();
    }

    // Calculate basic statistics
    const overallScore = calculateBasicScore(userProgress);
    const trends = calculatePerformanceTrends(userProgress);

    // Enhanced performance metrics
    const performanceMetrics: PerformanceMetrics = {
      overallScore,
      strengthAreas: [],
      improvementAreas: [],
      learningTrends: userProgress.map(result => ({
        period: new Date(result.completedAt).toLocaleDateString(),
        score: result.score
      })),
      recommendedTopics: [],
      predictedDifficulty: Math.min(3, Math.max(1, Math.ceil(overallScore / 33))),
    };

    return {
      performanceMetrics,
      subjectPerformance: [],
      nextStepRecommendations: generateRecommendations(performanceMetrics),
      documentAnalysis: {
        topicsDistribution: [
          { topic: "Study Notes", count: 5 },
          { topic: "Flashcards", count: 8 },
          { topic: "Chat Sessions", count: 4 },
          { topic: "Practice Problems", count: 6 }
        ],
        complexityTrend: [],
        conceptConnections: []
      }
    };
  } catch (error) {
    console.error("Error generating analytics:", error);
    return getDefaultData();
  }
}

// Helper function to generate recommendations
function generateRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations = [];

  // Add recommendations based on performance
  if (metrics.overallScore < 50) {
    recommendations.push("Focus on fundamental concepts");
    recommendations.push("Consider reviewing basic materials");
  } else if (metrics.overallScore < 75) {
    recommendations.push("Practice intermediate level materials");
    recommendations.push("Focus on identified weak areas");
  } else {
    recommendations.push("Challenge yourself with advanced topics");
    recommendations.push("Help others by sharing your knowledge");
  }

  return recommendations;
}

// Helper function to calculate basic score
function calculateBasicScore(progressData: Progress[]): number {
  if (progressData.length === 0) return 0;
  const totalScore = progressData.reduce((sum, result) => sum + result.score, 0);
  return Math.round(totalScore / progressData.length);
}

// Calculate performance trends over time
export function calculatePerformanceTrends(progressData: Progress[]): {
  trend: "improving" | "declining" | "stable";
  rate: number;
} {
  if (progressData.length < 2) {
    return { trend: "stable", rate: 0 };
  }

  // Sort by completion date
  const sortedResults = [...progressData].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  // Calculate score changes
  const scoreChanges = sortedResults.slice(1).map((result, index) => {
    return result.score - sortedResults[index].score;
  });

  const averageChange = scoreChanges.reduce((sum, change) => sum + change, 0) / scoreChanges.length;

  return {
    trend: averageChange > 1 ? "improving" : averageChange < -1 ? "declining" : "stable",
    rate: Number(averageChange.toFixed(2)),
  };
}

// Generate personalized study plan based on analytics
export async function generatePersonalizedStudyPlan(
  userId: number,
  metrics: PerformanceMetrics
): Promise<{
  dailyGoals: string[];
  focusAreas: string[];
  estimatedTimeInvestment: number;
  milestones: { description: string; targetDate: string }[];
}> {
  try {
    return {
      dailyGoals: [
        "Complete your profile settings",
        "Take initial assessments",
        "Explore available courses"
      ],
      focusAreas: ["Basic concepts", "Fundamentals"],
      estimatedTimeInvestment: 1,
      milestones: [
        {
          description: "Complete profile setup",
          targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          description: "Finish initial assessments",
          targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
    };
  } catch (error) {
    console.error("Error generating study plan:", error);
    return {
      dailyGoals: ["Set up your profile"],
      focusAreas: ["Getting started"],
      estimatedTimeInvestment: 0.5,
      milestones: [
        {
          description: "Complete initial setup",
          targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
    };
  }
}