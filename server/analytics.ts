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

// Add new interface for quiz answer analysis
interface QuizAnswerAnalysis {
  topic: string;
  correctCount: number;
  incorrectCount: number;
  mostCommonMistakes: {
    question: string;
    incorrectAnswer: string;
    frequency: number;
  }[];
  timeSpentAverage: number; // in seconds
}

// Default data function for new users or when data is not available
function getDefaultData(): {
  performanceMetrics: PerformanceMetrics;
  subjectPerformance: SubjectPerformance[];
  nextStepRecommendations: string[];
  quizAnalysis: {
    topicBreakdown: { topic: string; correctAnswers: number; totalQuestions: number }[];
    commonMistakes: { topic: string; description: string; frequency: number }[];
    timeOfDayPerformance: { timeSlot: string; averageScore: number }[];
    answerPatterns: {
      correctVsIncorrect: { category: string; count: number }[];
      topicAccuracy: { topic: string; accuracy: number }[];
      mistakeFrequency: { mistake: string; count: number }[];
    };
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
      timeOfDayPerformance: [],
      answerPatterns: {
        correctVsIncorrect: [
          { category: "Correct Answers", count: 0 },
          { category: "Incorrect Answers", count: 0 }
        ],
        topicAccuracy: [],
        mistakeFrequency: []
      }
    },
    documentAnalysis: {
      topicsDistribution: [
        { topic: "Study Notes", count: 5 },
        { topic: "Quiz Attempts", count: 3 },
        { topic: "Flashcards", count: 8 },
        { topic: "Chat Sessions", count: 4 },
        { topic: "Practice Problems", count: 6 }
      ],
      complexityTrend: [],
      conceptConnections: []
    }
  };
}

// Enhanced analytics function with better error handling
export async function generateAdvancedAnalytics(userId: number): Promise<{
  performanceMetrics: PerformanceMetrics;
  subjectPerformance: SubjectPerformance[];
  nextStepRecommendations: string[];
  quizAnalysis: {
    topicBreakdown: { topic: string; correctAnswers: number; totalQuestions: number }[];
    commonMistakes: { topic: string; description: string; frequency: number }[];
    timeOfDayPerformance: { timeSlot: string; averageScore: number }[];
    answerPatterns: {
      correctVsIncorrect: { category: string; count: number }[];
      topicAccuracy: { topic: string; accuracy: number }[];
      mistakeFrequency: { mistake: string; count: number }[];
    };
  };
  documentAnalysis: {
    topicsDistribution: { topic: string; count: number }[];
    complexityTrend: { month: string; averageComplexity: number }[];
    conceptConnections: { concept: string; relatedConcepts: string[]; strength: number }[];
  };
}> {
  try {
    console.log(`Generating analytics for user ${userId}`);

    // Get the user's quiz results
    const userQuizResults = await db.select().from(quizResults).where(eq(quizResults.userId, userId));

    if (userQuizResults.length === 0) {
      console.log(`No quiz results found for user ${userId}, returning default data`);
      return getDefaultData();
    }

    // Calculate questions count for each quiz result
    const processedResults = userQuizResults.map(quiz => ({
      ...quiz,
      totalQuestions: quiz.totalQuestions || 10, // Use the stored totalQuestions or fallback to 10
      correctAnswers: quiz.answers?.filter(a => a.isCorrect).length || Math.round(quiz.score / 10)
    }));

    // Analyze quiz answers with processed results
    const answerPatterns = {
      correctVsIncorrect: [
        {
          category: "Correct Answers",
          count: processedResults.reduce((acc, quiz) => acc + quiz.correctAnswers, 0)
        },
        {
          category: "Incorrect Answers",
          count: processedResults.reduce((acc, quiz) => acc + (quiz.totalQuestions - quiz.correctAnswers), 0)
        }
      ],
      topicAccuracy: processedResults.reduce((acc: { topic: string; accuracy: number }[], quiz) => {
        const topic = quiz.subject || "General";
        const existing = acc.find(item => item.topic === topic);
        if (existing) {
          existing.accuracy = (existing.accuracy + quiz.score) / 2;
        } else {
          acc.push({ topic, accuracy: quiz.score });
        }
        return acc;
      }, []),
      mistakeFrequency: [] // This would be populated with actual mistake data when available
    };

    // Calculate basic statistics
    const overallScore = calculateBasicScore(processedResults);
    const trends = calculatePerformanceTrends(processedResults);

    // Enhanced performance metrics
    const performanceMetrics: PerformanceMetrics = {
      overallScore,
      strengthAreas: answerPatterns.topicAccuracy
        .filter(topic => topic.accuracy >= 70)
        .map(topic => topic.topic),
      improvementAreas: answerPatterns.topicAccuracy
        .filter(topic => topic.accuracy < 70)
        .map(topic => topic.topic),
      learningTrends: processedResults.map(result => ({
        period: new Date(result.completedAt).toLocaleDateString(),
        score: result.score
      })),
      recommendedTopics: [],
      predictedDifficulty: Math.min(3, Math.max(1, Math.ceil(overallScore / 33))),
    };

    return {
      performanceMetrics,
      subjectPerformance: answerPatterns.topicAccuracy.map(topic => ({
        subject: topic.topic,
        averageScore: topic.accuracy,
        totalAttempts: processedResults.filter(quiz => quiz.subject === topic.topic).length,
        lastAttemptDate: processedResults
          .filter(quiz => quiz.subject === topic.topic)
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]?.completedAt.toISOString() || new Date().toISOString(),
        improvement: trends.rate
      })),
      nextStepRecommendations: generateRecommendations(performanceMetrics, answerPatterns),
      quizAnalysis: {
        topicBreakdown: answerPatterns.topicAccuracy.map(topic => ({
          topic: topic.topic,
          correctAnswers: Math.round(topic.accuracy * 100),
          totalQuestions: 100
        })),
        commonMistakes: generateCommonMistakes(processedResults),
        timeOfDayPerformance: generateTimeOfDayPerformance(processedResults),
        answerPatterns
      },
      documentAnalysis: {
        topicsDistribution: [
          { topic: "Study Notes", count: 5 },
          { topic: "Quiz Attempts", count: 3 },
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
function generateRecommendations(
  metrics: PerformanceMetrics,
  patterns: { topicAccuracy: { topic: string; accuracy: number }[] }
): string[] {
  const recommendations = [];

  // Add recommendations based on performance
  if (metrics.overallScore < 50) {
    recommendations.push("Focus on fundamental concepts");
    recommendations.push("Consider reviewing basic materials");
  } else if (metrics.overallScore < 75) {
    recommendations.push("Practice intermediate level questions");
    recommendations.push("Focus on weak areas identified in quizzes");
  } else {
    recommendations.push("Challenge yourself with advanced topics");
    recommendations.push("Help others by sharing your knowledge");
  }

  // Add topic-specific recommendations
  patterns.topicAccuracy
    .filter(topic => topic.accuracy < 70)
    .forEach(topic => {
      recommendations.push(`Review ${topic.topic} materials and practice more questions`);
    });

  return recommendations;
}

// Helper function to generate common mistakes analysis
function generateCommonMistakes(quizResults: QuizResult[]): { topic: string; description: string; frequency: number }[] {
  const topics = new Set(quizResults.map(result => result.subject || "General"));
  const mistakes = Array.from(topics).map(topic => {
    const topicResults = quizResults.filter(result => result.subject === topic);
    const avgScore = calculateBasicScore(topicResults);
    return {
      topic,
      description: `Average score: ${avgScore}%. ${avgScore < 70 ? 'Needs improvement' : 'Good performance'}`,
      frequency: 100 - avgScore
    };
  });
  return mistakes;
}

// Helper function to generate time of day performance analysis
function generateTimeOfDayPerformance(quizResults: QuizResult[]): { timeSlot: string; averageScore: number }[] {
  const timeSlots = ['Morning (6-12)', 'Afternoon (12-18)', 'Evening (18-24)', 'Night (0-6)'];
  return timeSlots.map(slot => {
    const slotResults = quizResults.filter(result => {
      const hour = new Date(result.completedAt).getHours();
      switch (slot) {
        case 'Morning (6-12)': return hour >= 6 && hour < 12;
        case 'Afternoon (12-18)': return hour >= 12 && hour < 18;
        case 'Evening (18-24)': return hour >= 18 && hour < 24;
        case 'Night (0-6)': return hour >= 0 && hour < 6;
      }
    });
    return {
      timeSlot: slot,
      averageScore: slotResults.length ? calculateBasicScore(slotResults) : 0
    };
  });
}

// Helper function to calculate basic score
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

// Generate personalized study plan based on analytics with proper error handling
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
    console.log(`Generating personalized study plan for user ${userId}`);
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert learning advisor. Generate a personalized study plan based on the user's performance metrics."
        },
        {
          role: "user",
          content: JSON.stringify(metrics)
        }
      ],
      response_format: { type: "json_object" }
    });

    const suggestedPlan = JSON.parse(response.choices[0].message.content || '{}');

    return {
      dailyGoals: suggestedPlan.dailyGoals || ["Complete your profile settings"],
      focusAreas: suggestedPlan.focusAreas || ["Basic concepts"],
      estimatedTimeInvestment: suggestedPlan.estimatedTimeInvestment || 1,
      milestones: suggestedPlan.milestones || [
        {
          description: "Complete initial setup",
          targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
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