import { Progress, QuizResult, StudyMaterial } from "@shared/schema";
import OpenAI from "openai";
import { db, progress, quizResults, studyMaterials } from "./db";
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

export async function generateAdvancedAnalytics(userId: number): Promise<{
  performanceMetrics: PerformanceMetrics;
  subjectPerformance: SubjectPerformance[];
  nextStepRecommendations: string[];
}> {
  // Fetch user's progress and quiz results
  const userProgress = await db
    .select()
    .from(progress)
    .where(eq(progress.userId, userId));

  const userQuizResults = await db
    .select()
    .from(quizResults)
    .where(eq(quizResults.userId, userId));

  // Fetch all study materials for reference
  const materials = await db.select().from(studyMaterials);

  // Prepare data for ML analysis
  const analysisData = {
    progress: userProgress,
    quizResults: userQuizResults,
    studyMaterials: materials,
  };

  try {
    const prompt = `Analyze this student's performance data and generate advanced insights including:
    1. Overall performance metrics
    2. Strength and improvement areas
    3. Learning trends over time
    4. Recommended topics based on current progress
    5. Predicted optimal difficulty level for new content
    6. Subject-specific performance analysis
    7. Next step recommendations

    Student Data:
    ${JSON.stringify(analysisData, null, 2)}

    Respond with a JSON object containing detailed analytics in this format:
    {
      "performanceMetrics": {
        "overallScore": number,
        "strengthAreas": string[],
        "improvementAreas": string[],
        "learningTrends": [{ "period": string, "score": number }],
        "recommendedTopics": string[],
        "predictedDifficulty": number
      },
      "subjectPerformance": [{
        "subject": string,
        "averageScore": number,
        "totalAttempts": number,
        "lastAttemptDate": string,
        "improvement": number
      }],
      "nextStepRecommendations": string[]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an advanced educational analytics system that analyzes student performance data and provides detailed insights and recommendations.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const result = JSON.parse(content);
    return {
      performanceMetrics: result.performanceMetrics,
      subjectPerformance: result.subjectPerformance,
      nextStepRecommendations: result.nextStepRecommendations,
    };
  } catch (error) {
    console.error("Error generating advanced analytics:", error);
    // Return default analytics if there's an error
    return {
      performanceMetrics: {
        overallScore: calculateBasicScore(userQuizResults),
        strengthAreas: [],
        improvementAreas: [],
        learningTrends: [],
        recommendedTopics: [],
        predictedDifficulty: 2,
      },
      subjectPerformance: [],
      nextStepRecommendations: [
        "Review recent materials",
        "Practice more quizzes",
        "Focus on challenging topics",
      ],
    };
  }
}

// Helper function to calculate basic score when ML analysis fails
function calculateBasicScore(quizResults: QuizResult[]): number {
  if (quizResults.length === 0) return 0;
  const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
  return Math.round(totalScore / quizResults.length);
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
    const prompt = `Based on these performance metrics, generate a personalized study plan:
    ${JSON.stringify(metrics, null, 2)}

    Respond with a JSON object containing:
    {
      "dailyGoals": string[],
      "focusAreas": string[],
      "estimatedTimeInvestment": number,
      "milestones": [{ "description": string, "targetDate": string }]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an educational planning system that creates personalized study plans based on student performance data.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating study plan:", error);
    return {
      dailyGoals: ["Review course materials", "Complete practice exercises"],
      focusAreas: metrics.improvementAreas,
      estimatedTimeInvestment: 2,
      milestones: [
        {
          description: "Complete current module",
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    };
  }
}
