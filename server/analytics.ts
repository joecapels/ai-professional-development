import { Progress, QuizResult, StudyMaterial } from "@shared/schema";
import OpenAI from "openai";
import { db, progress, quizResults, studyMaterials, users } from "./db";
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
  improvement: number; // percentage improvement over time
}

// Generate demo data for development and testing
function generateDemoData() {
  const subjects = [
    "Biology",
    "History",
    "Music Theory",
    "Art History",
    "Physics",
    "Literature",
    "Mathematics",
    "Chemistry",
    "World Geography",
    "Computer Science"
  ];

  const demoPerformanceMetrics: PerformanceMetrics = {
    overallScore: 78,
    strengthAreas: [
      "Biology - Cell Structure and Function",
      "Music Theory - Scales and Harmony",
      "Art History - Renaissance Period",
      "History - Ancient Civilizations"
    ],
    improvementAreas: [
      "Physics - Quantum Mechanics",
      "Chemistry - Organic Compounds",
      "Mathematics - Calculus",
      "Literature - Modern Poetry"
    ],
    learningTrends: [
      { period: "Week 1", score: 65 },
      { period: "Week 2", score: 70 },
      { period: "Week 3", score: 75 },
      { period: "Week 4", score: 78 },
      { period: "Week 5", score: 82 }
    ],
    recommendedTopics: [
      "Advanced Cell Biology",
      "Baroque Music Composition",
      "Modern Art Movements",
      "World History - Industrial Revolution"
    ],
    predictedDifficulty: 3
  };

  const demoSubjectPerformance: SubjectPerformance[] = subjects.map(subject => ({
    subject,
    averageScore: 60 + Math.floor(Math.random() * 30),
    totalAttempts: 5 + Math.floor(Math.random() * 10),
    lastAttemptDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    improvement: Math.floor(Math.random() * 15)
  }));

  const demoRecommendations = [
    "Focus on practical applications in Physics to strengthen understanding",
    "Review fundamental concepts in Organic Chemistry",
    "Practice more Calculus problems with real-world examples",
    "Explore contemporary literature to build analysis skills",
    "Continue excellent progress in Biology and Music Theory"
  ];

  // Add demo quiz analysis data
  const demoQuizAnalysis = {
    topicBreakdown: [
      { topic: "Biology", correctAnswers: 45, totalQuestions: 50 },
      { topic: "Physics", correctAnswers: 32, totalQuestions: 50 },
      { topic: "Chemistry", correctAnswers: 38, totalQuestions: 50 },
      { topic: "Mathematics", correctAnswers: 42, totalQuestions: 50 },
      { topic: "Literature", correctAnswers: 47, totalQuestions: 50 }
    ],
    commonMistakes: [
      {
        topic: "Physics - Force and Motion",
        description: "Difficulty applying Newton's laws to complex scenarios",
        frequency: 8
      },
      {
        topic: "Chemistry - Organic Compounds",
        description: "Confusion with naming conventions and structures",
        frequency: 6
      },
      {
        topic: "Mathematics - Integration",
        description: "Struggles with integration by parts method",
        frequency: 5
      }
    ],
    timeOfDayPerformance: [
      { timeSlot: "Morning", averageScore: 85 },
      { timeSlot: "Afternoon", averageScore: 78 },
      { timeSlot: "Evening", averageScore: 72 },
      { timeSlot: "Night", averageScore: 68 }
    ]
  };

  // Add demo document analysis data
  const demoDocumentAnalysis = {
    topicsDistribution: [
      { topic: "Biology", count: 15 },
      { topic: "Physics", count: 12 },
      { topic: "Chemistry", count: 10 },
      { topic: "Mathematics", count: 18 },
      { topic: "Literature", count: 14 }
    ],
    complexityTrend: [
      { month: "January", averageComplexity: 2.5 },
      { month: "February", averageComplexity: 3.2 },
      { month: "March", averageComplexity: 3.8 }
    ],
    conceptConnections: [
      {
        concept: "Cell Biology",
        relatedConcepts: ["Genetics", "Biochemistry", "Molecular Biology"],
        strength: 0.85
      },
      {
        concept: "Classical Mechanics",
        relatedConcepts: ["Forces", "Motion", "Energy"],
        strength: 0.78
      },
      {
        concept: "Organic Chemistry",
        relatedConcepts: ["Molecular Structure", "Reactions", "Synthesis"],
        strength: 0.72
      }
    ]
  };

  return {
    performanceMetrics: demoPerformanceMetrics,
    subjectPerformance: demoSubjectPerformance,
    nextStepRecommendations: demoRecommendations,
    quizAnalysis: demoQuizAnalysis,
    documentAnalysis: demoDocumentAnalysis
  };
}

// Update the default data function to include the new fields
function getDefaultData(): {
  performanceMetrics: PerformanceMetrics;
  subjectPerformance: SubjectPerformance[];
  nextStepRecommendations: string[];
  quizAnalysis: {
    topicBreakdown: { topic: string; correctAnswers: number; totalQuestions: number }[];
    commonMistakes: { topic: string; description: string; frequency: number }[];
    timeOfDayPerformance: { timeSlot: string; averageScore: number }[];
  };
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
    quizAnalysis: {
      topicBreakdown: [],
      commonMistakes: [],
      timeOfDayPerformance: []
    },
    documentAnalysis: {
      topicsDistribution: [],
      complexityTrend: [],
      conceptConnections: []
    }
  };
}

export async function generateAdvancedAnalytics(userId: number): Promise<{
  performanceMetrics: PerformanceMetrics;
  subjectPerformance: SubjectPerformance[];
  nextStepRecommendations: string[];
  quizAnalysis: {
    topicBreakdown: { topic: string; correctAnswers: number; totalQuestions: number }[];
    commonMistakes: { topic: string; description: string; frequency: number }[];
    timeOfDayPerformance: { timeSlot: string; averageScore: number }[];
  };
  documentAnalysis: {
    topicsDistribution: { topic: string; count: number }[];
    complexityTrend: { month: string; averageComplexity: number }[];
    conceptConnections: { concept: string; relatedConcepts: string[]; strength: number }[];
  };
}> {
  try {
    // Check if the user is "joe"
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (user && user.username === "joe") {
      return generateDemoData();
    }

    return getDefaultData();
  } catch (error) {
    console.error("Error checking user:", error);
    return getDefaultData();
  }
}

// Helper function to calculate basic score when ML analysis fails
function calculateBasicScore(quizResults: QuizResult[]): number {
  if (quizResults.length === 0) return 0;
  const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
  return Math.round(totalScore / quizResults.length);
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
    // Check if the user is "joe"
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (user && user.username === "joe") {
      // Return demo study plan for joe
      return {
        dailyGoals: [
          "Review Biology Chapter 5: Cell Division",
          "Practice Music Theory scales for 30 minutes",
          "Study Art History: Modern Period",
          "Complete 2 Physics practice problems"
        ],
        focusAreas: metrics.improvementAreas,
        estimatedTimeInvestment: 2.5,
        milestones: [
          {
            description: "Complete Biology Module Assessment",
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            description: "Master Basic Music Theory Concepts",
            targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            description: "Finish Art History Period Overview",
            targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          }
        ],
      };
    }

    // Return default study plan for other users
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
    console.error("Error checking user:", error);
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

// Calculate performance trends over time
export function calculatePerformanceTrends(quizResults: QuizResult[]): {
  trend: "improving" | "declining" | "stable";
  rate: number;
} {
  if (quizResults.length < 2) {
    return { trend: "stable", rate: 0 };
  }

  // Sort by completion date
  const sortedResults = [...quizResults].sort(
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