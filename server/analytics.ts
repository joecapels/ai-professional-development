import { Progress, QuizResult, StudyMaterial } from "@shared/schema";
import OpenAI from "openai";
import { db, progress, quizResults, studyMaterials, users } from "./db";
import { eq } from "drizzle-orm";

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
    // Fetch user's quiz results and associated materials
    const userQuizResults = await db.select().from(quizResults).where(eq(quizResults.userId, userId));
    const userProgress = await db.select().from(progress).where(eq(progress.userId, userId));
    const userMaterials = await db.select().from(studyMaterials);

    // Extract subjects from study materials
    const subjects = Array.from(new Set(userMaterials.map(m => m.subject || "General")));

    // Calculate subject-based scores
    const subjectScores = new Map<string, number[]>();

    // Initialize subject scores
    subjects.forEach(subject => {
      subjectScores.set(subject, []);
    });

    // Calculate scores per subject based on quiz results
    userQuizResults.forEach(result => {
      const associatedMaterial = userMaterials.find(m => m.id === result.materialId);
      const subject = associatedMaterial?.subject || "General";
      subjectScores.get(subject)?.push(result.score);
    });

    // Calculate strength and improvement areas
    const strengthAreas: string[] = [];
    const improvementAreas: string[] = [];

    subjectScores.forEach((scores, subject) => {
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avgScore >= 80) {
          strengthAreas.push(subject);
        } else if (avgScore < 60) {
          improvementAreas.push(subject);
        }
      }
    });

    // Calculate overall score
    const overallScore = calculateBasicScore(userQuizResults);
    const performanceTrend = calculatePerformanceTrends(userQuizResults);

    // Calculate learning trends using completedAt instead of timestamp
    const learningTrends = userProgress.map(p => ({
      period: new Date(p.completedAt).toLocaleDateString(),
      score: p.score
    })).sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());

    // Generate topic breakdown
    const topicBreakdown = Array.from(subjectScores.entries()).map(([topic, scores]) => ({
      topic,
      correctAnswers: scores.filter(score => score >= 70).length,
      totalQuestions: scores.length
    }));

    // Calculate time of day performance
    const timeSlotPerformance = new Map<string, number[]>();
    userQuizResults.forEach(result => {
      const hour = new Date(result.completedAt).getHours();
      const timeSlot = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
      if (!timeSlotPerformance.has(timeSlot)) {
        timeSlotPerformance.set(timeSlot, []);
      }
      timeSlotPerformance.get(timeSlot)?.push(result.score);
    });

    const timeOfDayPerformance = Array.from(timeSlotPerformance.entries())
      .filter(([, scores]) => scores.length > 0)
      .map(([timeSlot, scores]) => ({
        timeSlot,
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length
      }));

    // Generate recommendations
    const recommendedTopics = improvementAreas.map(area => `Focus on ${area} fundamentals`);
    if (recommendedTopics.length === 0) {
      recommendedTopics.push("Explore advanced topics in your strong subjects");
    }

    return {
      performanceMetrics: {
        overallScore,
        strengthAreas,
        improvementAreas,
        learningTrends,
        recommendedTopics,
        predictedDifficulty: Math.min(5, Math.max(1, Math.ceil(overallScore / 20)))
      },
      subjectPerformance: Array.from(subjectScores.entries())
        .filter(([, scores]) => scores.length > 0)
        .map(([subject, scores]) => ({
          subject,
          averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
          totalAttempts: scores.length,
          lastAttemptDate: new Date().toISOString(),
          improvement: performanceTrend.rate
        })),
      nextStepRecommendations: [
        ...recommendedTopics,
        "Review past quiz mistakes",
        "Practice with interactive exercises"
      ],
      quizAnalysis: {
        topicBreakdown,
        commonMistakes: improvementAreas.map(area => ({
          topic: area,
          description: `Needs improvement in ${area} concepts`,
          frequency: 1
        })),
        timeOfDayPerformance
      },
      documentAnalysis: {
        topicsDistribution: Array.from(subjectScores.keys()).map(topic => ({
          topic,
          count: userMaterials.filter(m => m.subject === topic).length
        })),
        complexityTrend: userProgress.map(p => ({
          month: new Date(p.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          averageComplexity: p.score / 20
        })),
        conceptConnections: strengthAreas.map(concept => ({
          concept,
          relatedConcepts: strengthAreas.filter(c => c !== concept),
          strength: 0.8
        }))
      }
    };
  } catch (error) {
    console.error("Error generating analytics:", error);
    return getDefaultData();
  }
}

// Helper function to calculate basic score
function calculateBasicScore(quizResults: QuizResult[]): number {
  if (quizResults.length === 0) return 0;
  const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
  return Math.round(totalScore / quizResults.length);
}

// Calculate performance trends over time
function calculatePerformanceTrends(quizResults: QuizResult[]): {
  trend: "improving" | "declining" | "stable";
  rate: number;
} {
  if (quizResults.length < 2) {
    return { trend: "stable", rate: 0 };
  }

  const sortedResults = [...quizResults].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const scoreChanges = sortedResults.slice(1).map((result, index) => {
    return result.score - sortedResults[index].score;
  });

  const averageChange = scoreChanges.reduce((sum, change) => sum + change, 0) / scoreChanges.length;

  return {
    trend: averageChange > 1 ? "improving" : averageChange < -1 ? "declining" : "stable",
    rate: Number(averageChange.toFixed(2)),
  };
}

// Helper function for default data
function getDefaultData() {
  return {
    performanceMetrics: {
      overallScore: 0,
      strengthAreas: [],
      improvementAreas: [],
      learningTrends: [{ period: "Week 1", score: 0 }],
      recommendedTopics: ["Start with introductory materials"],
      predictedDifficulty: 1
    },
    subjectPerformance: [{
      subject: "General",
      averageScore: 0,
      totalAttempts: 0,
      lastAttemptDate: new Date().toISOString(),
      improvement: 0
    }],
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