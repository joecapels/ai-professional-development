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

  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quizzes", {
        subject,
        difficulty,
      });
      return res.json();
    },
    onSuccess: (quiz: Quiz) => {
      setCurrentQuiz(quiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setShowExplanation(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to generate quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (data: { quizId: number; answers: { questionIndex: number; selectedAnswer: string; isCorrect: boolean }[] }) => {
      const res = await apiRequest("POST", "/api/quiz-results", data);
      return res.json();
    },
    onSuccess: (result: QuizResult) => {
      toast({
        title: "Quiz completed!",
        description: `Your score: ${result.score}%`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      setLocation("/"); // Redirect to home page after quiz completion
    },
  });

  const handleEndQuiz = () => {
    if (!currentQuiz?.questions) return;

    // Calculate score based on answered questions
    const answers = selectedAnswers.map((selectedAnswer, index) => ({
      questionIndex: index,
      selectedAnswer: selectedAnswer || "",
      isCorrect: selectedAnswer === currentQuiz.questions[index]?.correctAnswer,
    }));

    // Add empty answers for unanswered questions
    while (answers.length < currentQuiz.questions.length) {
      answers.push({
        questionIndex: answers.length,
        selectedAnswer: "",
        isCorrect: false,
      });
    }

    submitAnswerMutation.mutate({
      quizId: currentQuiz.id,
      answers,
    });
  };

  const currentQuestion: Question | undefined = currentQuiz?.questions?.[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);

    if (currentQuestionIndex === (currentQuiz?.questions?.length || 0) - 1) {
      // Submit quiz if it's the last question
      submitAnswerMutation.mutate({
        quizId: currentQuiz!.id,
        answers: newAnswers.map((selectedAnswer, index) => ({
          questionIndex: index,
          selectedAnswer,
          isCorrect: selectedAnswer === currentQuiz?.questions?.[index].correctAnswer,
        })),
      });
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setShowExplanation(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-8">
        {!currentQuiz ? (
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
                    <Button
                      onClick={handleNextQuestion}
                      className="mt-4"
                    >
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