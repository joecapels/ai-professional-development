import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import type { Quiz, QuizResult } from "@shared/schema";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function QuizPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState<number>(1);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      try {
        setError(null);
        setIsLoading(true);
        const res = await apiRequest("POST", "/api/quizzes", {
          subject,
          difficulty,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Failed to generate quiz: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Generated quiz data:", data);

        // Enhanced validation
        if (!data || typeof data !== 'object') {
          throw new Error("Invalid quiz response format");
        }

        if (!data.id || !data.questions) {
          throw new Error("Quiz is missing required fields (id or questions)");
        }

        if (!Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error("No questions available in the quiz. Please try again.");
        }

        // Validate each question structure
        data.questions.forEach((q: any, index: number) => {
          if (!q.question || !Array.isArray(q.options) || !q.correctAnswer || !q.explanation) {
            throw new Error(`Invalid question format at question ${index + 1}`);
          }
          if (q.options.length < 2) {
            throw new Error(`Question ${index + 1} has insufficient options (minimum 2 required)`);
          }
        });

        return data;
      } catch (err) {
        console.error("Quiz generation error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (quiz: Quiz) => {
      console.log("Setting quiz state:", quiz);
      setCurrentQuiz(quiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setShowExplanation(false);
      setError(null);
    },
    onError: (error: Error) => {
      console.error("Quiz generation error:", error);
      setError(error.message);
      toast({
        title: "Failed to generate quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (data: {
      quizId: number;
      totalQuestions: number;
      answers: { questionIndex: number; selectedAnswer: string; isCorrect: boolean }[];
    }) => {
      const res = await apiRequest("POST", "/api/quiz-results", data);
      if (!res.ok) {
        throw new Error("Failed to submit quiz results");
      }
      return res.json();
    },
    onSuccess: (result: QuizResult) => {
      toast({
        title: "Quiz completed!",
        description: `Your score: ${result.score}%`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Failed to submit quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEndQuiz = () => {
    if (!currentQuiz?.questions || !Array.isArray(currentQuiz.questions)) {
      console.error("Invalid quiz state:", currentQuiz);
      return;
    }

    const answers = selectedAnswers.map((selectedAnswer, index) => ({
      questionIndex: index,
      selectedAnswer: selectedAnswer || "",
      isCorrect: selectedAnswer === currentQuiz.questions?.[index]?.correctAnswer,
    }));

    while (answers.length < currentQuiz.questions.length) {
      answers.push({
        questionIndex: answers.length,
        selectedAnswer: "",
        isCorrect: false,
      });
    }

    submitAnswerMutation.mutate({
      quizId: currentQuiz.id,
      totalQuestions: currentQuiz.questions.length,
      answers,
    });
  };

  const currentQuestion: Question | undefined = currentQuiz?.questions?.[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuiz?.questions) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!currentQuiz?.questions) return;
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowExplanation(false);
    } else {
      handleEndQuiz();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-8">
        {error && (
          <Card className="mb-4 bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-destructive">{error}</p>
              <Button
                className="mt-2"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setCurrentQuiz(null);
                }}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Generating quiz questions...</p>
            </CardContent>
          </Card>
        ) : !currentQuiz ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Generate a Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block mb-2">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter a subject (e.g., Mathematics, History)"
                />
              </div>
              <div>
                <label className="block mb-2">Difficulty</label>
                <Select
                  value={difficulty.toString()}
                  onValueChange={(value) => setDifficulty(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Easy</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => generateQuizMutation.mutate()}
                disabled={!subject || generateQuizMutation.isPending}
                className="w-full"
              >
                {generateQuizMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Quiz
              </Button>
            </CardContent>
          </Card>
        ) : currentQuestion ? (
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Question {currentQuestionIndex + 1} of{" "}
                {currentQuiz.questions?.length}
              </CardTitle>
              <Button
                variant="outline"
                onClick={handleEndQuiz}
                disabled={submitAnswerMutation.isPending}
              >
                End Quiz
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg font-medium">{currentQuestion.question}</p>
              <div className="grid gap-2">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={
                      selectedAnswers[currentQuestionIndex] === option
                        ? "default"
                        : "outline"
                    }
                    className="justify-start"
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showExplanation}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              {showExplanation && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">
                    {selectedAnswers[currentQuestionIndex] ===
                    currentQuestion.correctAnswer
                      ? "✅ Correct!"
                      : "❌ Incorrect"}
                  </p>
                  <p>{currentQuestion.explanation}</p>
                  {currentQuestionIndex < currentQuiz.questions!.length - 1 && (
                    <Button onClick={handleNextQuestion} className="mt-4">
                      Next Question
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}