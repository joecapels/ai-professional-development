import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Brain, Clock, LineChart, BookOpen, MessageSquare, Quote } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import type { StudyMaterial, Progress as ProgressType, SavedDocument, QuizResult } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { MoodTracker } from "@/components/mood-tracker";
import { format } from "date-fns";

// Motivational quotes array
const motivationalQuotes = [
  {
    text: "Education is not preparation for life; education is life itself.",
    author: "John Dewey"
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King"
  },
  {
    text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss"
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi"
  },
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes"
  }
];

export default function StudentPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: materials, isLoading: materialsLoading } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/materials"],
  });

  const { data: progress, isLoading: progressLoading } = useQuery<ProgressType[]>({
    queryKey: ["/api/progress"],
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<string[]>({
    queryKey: ["/api/recommendations"],
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<SavedDocument[]>({
    queryKey: ["/api/documents"],
  });

  const { data: quizResults, isLoading: quizResultsLoading } = useQuery<QuizResult[]>({
    queryKey: ["/api/quiz-results"],
  });

  // Get a random quote
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  if (materialsLoading || progressLoading || recommendationsLoading || documentsLoading || quizResultsLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Calculate quiz statistics
  const totalQuizzes = quizResults?.length || 0;
  const averageScore = quizResults?.length
    ? Math.round(quizResults.reduce((acc, quiz) => acc + quiz.score, 0) / quizResults.length)
    : 0;
  const latestQuiz = quizResults?.sort((a, b) =>
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )[0];

  // Calculate chat statistics
  const chatDocuments = documents?.filter(doc => doc.type === "chat") || [];
  const totalChats = chatDocuments.length;
  const latestChat = chatDocuments.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];


  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-8">
        {user?.username === "joe" && (
          <Alert className="mb-6">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              You are viewing demo data. As you use the platform, this section will be populated with your actual learning progress and insights.
            </AlertDescription>
          </Alert>
        )}

        <h1 className="text-4xl font-bold mb-4">Welcome back, {user?.username}!</h1>

        {/* Motivational Quote Card */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-start">
              <Quote className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="text-lg font-medium italic mb-2">{randomQuote.text}</p>
                <p className="text-sm text-muted-foreground">― {randomQuote.author}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood Tracker */}
        <Card className="mb-8">
          <MoodTracker />
        </Card>

        {/* Chat Statistics Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI Study Chat Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Chats</p>
                <p className="text-2xl font-bold">{totalChats}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Latest Chat</p>
                {latestChat ? (
                  <div>
                    <p className="text-lg font-semibold truncate">{latestChat.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(latestChat.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No chats yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Statistics Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Quiz Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Quizzes</p>
                <p className="text-2xl font-bold">{totalQuizzes}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{averageScore}%</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Latest Quiz</p>
                {latestQuiz ? (
                  <div>
                    <p className="text-2xl font-bold">{latestQuiz.score}%</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(latestQuiz.completedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No quizzes taken yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Feature Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* AI Learning Assistant */}
          <Card
            className="hover:border-primary cursor-pointer transition-colors"
            onClick={() => setLocation("/chat")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Learning Assistant
              </CardTitle>
              <CardDescription>
                Get personalized help and explanations from our AI tutor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ask questions, get explanations, and receive instant feedback tailored to your learning style
              </p>
            </CardContent>
          </Card>

          {/* Real-time Study Tracking */}
          <Card
            className="hover:border-primary cursor-pointer transition-colors"
            onClick={() => setLocation("/study-tracker")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Study Tracking
              </CardTitle>
              <CardDescription>
                Track your study sessions in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor focus time, take breaks, and build consistent study habits
              </p>
            </CardContent>
          </Card>

          {/* Analytics & Insights */}
          <Card
            className="hover:border-primary cursor-pointer transition-colors"
            onClick={() => setLocation("/analytics")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                Analytics & Insights
              </CardTitle>
              <CardDescription>
                Visualize your learning progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get detailed insights into your performance and personalized recommendations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Progress Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents?.slice(0, 10).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between hover:bg-muted p-2 rounded-lg cursor-pointer"
                    onClick={() => setLocation("/documents")}
                  >
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.type} • {format(new Date(doc.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
                {(!documents || documents.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No documents created yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recommendations?.slice(0, 3).map((rec, i) => (
                  <div key={i} className="p-2 rounded-lg bg-muted">
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
                {(!recommendations || recommendations.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    Complete some lessons to get personalized recommendations
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}