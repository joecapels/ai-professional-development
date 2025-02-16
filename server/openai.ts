import OpenAI from "openai";
import { Progress } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an AI tutor focused on providing personalized learning recommendations and generating practice questions. Your responses should be educational, encouraging, and tailored to the student's needs.`;

export async function generateStudyRecommendations(
  progress: Progress[]
): Promise<string[]> {
  try {
    const prompt = `Based on the student's progress data, provide 3-5 focused study recommendations.
    Consider their performance scores and completed materials.

    Progress Data:
    ${JSON.stringify(progress, null, 2)}

    Respond with a JSON array of string recommendations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const result = JSON.parse(content);
    return result.recommendations || [];
  } catch (error) {
    console.error("Error generating study recommendations:", error);
    return [
      "Review your recent study materials",
      "Focus on topics with lower scores",
      "Practice regularly to improve retention"
    ];
  }
}

interface PracticeQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export async function generatePracticeQuestions(
  subject: string,
  difficulty: number
): Promise<PracticeQuestion[]> {
  try {
    const prompt = `Generate 3 multiple-choice practice questions for the subject "${subject}" at difficulty level ${difficulty} (1-5).
    Each question should have:
    - Clear question text
    - 4 possible options
    - The correct answer
    - A brief explanation

    Respond with a JSON object containing an array of questions with the following structure:
    {
      "questions": [
        {
          "question": "question text",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "correct option",
          "explanation": "explanation text"
        }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const result = JSON.parse(content);
    return result.questions || [];
  } catch (error) {
    console.error("Error generating practice questions:", error);
    return [
      {
        question: "An error occurred while generating questions. Please try again later.",
        options: ["OK"],
        correctAnswer: "OK",
        explanation: "System is temporarily unavailable."
      }
    ];
  }
}

// Content enhancer function to add AI-generated examples and explanations
export async function enhanceStudyContent(
  content: string,
  subject: string
): Promise<string> {
  try {
    const prompt = `Enhance the following study content with relevant examples and clear explanations.
    Make it more engaging while maintaining educational value.

    Subject: ${subject}
    Content: ${content}

    Respond with a JSON object containing the enhanced content:
    {
      "enhancedContent": "formatted content with examples"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No content in response");
    }

    const result = JSON.parse(responseContent);
    return result.enhancedContent || content;
  } catch (error) {
    console.error("Error enhancing study content:", error);
    return content;
  }
}

// Performance analyzer to provide detailed feedback
export async function analyzePerformance(progress: Progress[]): Promise<string> {
  try {
    const prompt = `Analyze the student's performance data and provide detailed feedback
    on their learning progress, strengths, and areas for improvement.

    Progress Data:
    ${JSON.stringify(progress, null, 2)}

    Respond with a JSON object containing the analysis:
    {
      "analysis": "detailed feedback text"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const result = JSON.parse(content);
    return result.analysis || "Unable to analyze performance at this time.";
  } catch (error) {
    console.error("Error analyzing performance:", error);
    return "Unable to analyze performance at this time. Please try again later.";
  }
}