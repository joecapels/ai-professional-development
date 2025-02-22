import OpenAI from "openai";
import { Progress } from "@shared/schema";

// Using gpt-4-turbo-preview as the default model for optimal performance
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Enhanced system prompt to handle multi-modal interactions
const SYSTEM_PROMPT = `You are an AI tutor focused on providing personalized learning recommendations and generating practice questions.
Your responses should be educational, encouraging, and tailored to the student's level and interests.
You can understand and respond to various types of inputs including text, images, and complex concepts.
Adjust your language, examples, and complexity based on the student's grade level.`;

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
      model: "gpt-4-turbo-preview",
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

// Update the practice questions generation function for better error handling
export async function generatePracticeQuestions(
  subject: string,
  difficulty: number
): Promise<PracticeQuestion[]> {
  try {
    console.log(`Generating practice questions for subject: ${subject}, difficulty: ${difficulty}`);
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
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("No content in OpenAI response");
      throw new Error("Empty response from OpenAI");
    }

    console.log("Raw OpenAI Response:", content);

    try {
      const result = JSON.parse(content);
      console.log("Parsed OpenAI Response:", result);

      if (!result.questions || !Array.isArray(result.questions)) {
        console.error("Invalid response format:", result);
        return [
          {
            question: "What would you like to study?",
            options: ["Math", "Science", "History", "Literature"],
            correctAnswer: "Math",
            explanation: "Let's start with a topic you're interested in."
          }
        ];
      }

      // Validate each question
      const validQuestions = result.questions.filter(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length >= 2 &&
        q.correctAnswer &&
        q.explanation
      );

      if (validQuestions.length === 0) {
        console.error("No valid questions in response");
        return [
          {
            question: "What subject interests you the most?",
            options: ["Mathematics", "Sciences", "Languages", "Arts"],
            correctAnswer: "Mathematics",
            explanation: "Choose a subject to begin your learning journey."
          }
        ];
      }

      return validQuestions;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      throw new Error("Failed to parse quiz questions");
    }
  } catch (error) {
    console.error("Error generating practice questions:", error);
    return [
      {
        question: "Would you like to try a different subject?",
        options: ["Yes, try another subject", "No, go back", "Need help", "Contact support"],
        correctAnswer: "Yes, try another subject",
        explanation: "Let's find a subject that works better for you."
      }
    ];
  }
}

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
      model: "gpt-4-turbo-preview",
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
      model: "gpt-4-turbo-preview",
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

interface LearningPreferences {
  learningStyle: string;
  pacePreference: string;
  explanationDetail: string;
  exampleFrequency: string;
  chatbotPersonality?: "encouraging" | "socratic" | "professional" | "friendly";
  gradeLevel: string;
  researchAreas?: string[];
}

export async function handleStudyChat(
  message: string,
  preferences?: LearningPreferences | null
): Promise<string> {
  try {
    const personalityPrompts = {
      encouraging: "Be encouraging and motivating. Celebrate student successes and provide positive reinforcement. Use phrases like 'Great question!' and 'You're making excellent progress!'",
      socratic: "Use the Socratic method. Guide students to answers through questioning. Help them discover solutions themselves rather than providing direct answers.",
      professional: "Maintain a professional and formal tone. Focus on clear, concise explanations with academic language.",
      friendly: "Be casual and approachable. Use conversational language and relatable examples.",
    };

    const personalityPrompt = preferences?.chatbotPersonality
      ? personalityPrompts[preferences.chatbotPersonality]
      : personalityPrompts.professional;

    const preferencesPrompt = preferences
      ? `
        Consider these learning preferences when responding:
        - Educational Level: ${preferences.gradeLevel}
        - Research Interests: ${preferences.researchAreas?.join(", ")}
        - Learning Style: ${preferences.learningStyle}
        - Pace: ${preferences.pacePreference}
        - Detail Level: ${preferences.explanationDetail}
        - Example Frequency: ${preferences.exampleFrequency}

        Personality Instructions: ${personalityPrompt}

        Adapt your response style accordingly:
        - Match the complexity to the educational level
        - Use examples from their research interests when possible
        - If visual learning style, use more descriptive language and suggest diagrams
        - If comprehensive detail is preferred, provide in-depth explanations
        - If many examples are preferred, include multiple relevant examples
        `
      : "";

    const prompt = `You are an AI study assistant. ${preferencesPrompt}
    Help the student with their question: "${message}"

    Respond with a JSON object in this format:
    {
      "message": "your helpful response"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
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
    return result.message;
  } catch (error) {
    console.error("Error in study chat:", error);
    return "I apologize, but I'm having trouble processing your question. Please try again.";
  }
}

export async function generateMoodSuggestion(mood: string): Promise<string> {
  try {
    console.log(`Generating mood suggestion for mood: ${mood}`);
    const prompt = `Given a student feeling "${mood}", provide a brief, encouraging suggestion for their learning session.
    Your response must be a JSON object with a single "suggestion" field containing a supportive message.
    The message should be empathetic, positive, and actionable.
    Keep it under 2-3 sentences.

    Example format:
    {
      "suggestion": "I understand you're feeling unmotivated. Take a 5-minute break to stretch, then try breaking your study session into smaller, manageable chunks."
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("Empty response from OpenAI");
      return "I'm here to support you. Let's make the most of your study session!";
    }

    console.log("Raw OpenAI response:", content);

    try {
      const result = JSON.parse(content);
      return result.suggestion || "Keep going, you're doing great!";
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Raw content:", content);
      return "I'm here to support your learning journey. Let's keep going!";
    }
  } catch (error) {
    console.error("Error generating mood suggestion:", error);
    return "Keep going, you're doing great!";
  }
}

export async function generateFlashcardsFromContent(contentText: string): Promise<{ front: string; back: string; difficulty: number }[]> {
  try {
    const prompt = `Generate a set of flashcards from the following content. Each flashcard should have a front (question/concept) and back (answer/explanation).
    The flashcards should cover key concepts and be suitable for effective learning.
    Ensure the cards are clear, concise, and focus on important information.

    Content to process:
    ${contentText}

    Respond with a JSON object in this format:
    {
      "flashcards": [
        {
          "front": "question or concept",
          "back": "answer or explanation",
          "difficulty": number between 1-5
        }
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
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
    return result.flashcards || [];
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error("Failed to generate flashcards from content");
  }
}

// Add new interface for multi-modal messages
interface MultiModalMessage {
  type: 'text' | 'image' | 'code' | 'math';
  content: string;
  metadata?: {
    format?: string;
    language?: string;
  };
}

// Enhanced chat handler for multi-modal support
export async function handleMultiModalChat(
  messages: MultiModalMessage[],
  preferences?: LearningPreferences | null
): Promise<string> {
  try {
    const formattedMessages = messages.map(msg => {
      if (msg.type === 'image') {
        return {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: "Please analyze this image:"
            },
            {
              type: "image_url" as const,
              image_url: { url: msg.content }
            }
          ]
        };
      } else if (msg.type === 'code') {
        return {
          role: "user" as const,
          content: `\`\`\`${msg.metadata?.language || ''}\n${msg.content}\n\`\`\``
        };
      } else if (msg.type === 'math') {
        return {
          role: "user" as const,
          content: `Here's a mathematical expression to analyze: ${msg.content}`
        };
      }
      return {
        role: "user" as const,
        content: msg.content
      };
    });

    const personalityPrompt = preferences?.chatbotPersonality
      ? getPersonalityPrompt(preferences.chatbotPersonality)
      : getPersonalityPrompt('professional');

    const preferencesContext = preferences
      ? generatePreferencesContext(preferences)
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview", // Using vision model for image support
      messages: [
        { 
          role: "system" as const, 
          content: `${SYSTEM_PROMPT}\n${personalityPrompt}\n${preferencesContext}` 
        },
        ...formattedMessages as any // Type assertion needed for mixed content types
      ],
      max_tokens: 1000
    });

    return response.choices[0].message.content || "I apologize, but I couldn't process your request.";
  } catch (error) {
    console.error("Error in multi-modal chat:", error);
    return "I apologize, but I'm having trouble processing your input. Please try again.";
  }
}

// Helper function to generate personality prompt
function getPersonalityPrompt(personality: "encouraging" | "socratic" | "professional" | "friendly"): string {
  const prompts = {
    encouraging: "Be encouraging and motivating. Celebrate student successes and provide positive reinforcement.",
    socratic: "Use the Socratic method. Guide students to answers through questioning.",
    professional: "Maintain a professional and formal tone. Focus on clear, concise explanations.",
    friendly: "Be casual and approachable. Use conversational language and relatable examples."
  };
  return prompts[personality];
}

// Helper function to generate preferences context
function generatePreferencesContext(preferences: LearningPreferences): string {
  return `
    Consider these learning preferences:
    - Educational Level: ${preferences.gradeLevel}
    - Research Interests: ${preferences.researchAreas?.join(", ")}
    - Learning Style: ${preferences.learningStyle}
    - Pace: ${preferences.pacePreference}
    - Detail Level: ${preferences.explanationDetail}
    - Example Frequency: ${preferences.exampleFrequency}
  `;
}

// Export new types and interfaces
export type { MultiModalMessage };