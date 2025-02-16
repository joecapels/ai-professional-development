import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Brain, Clock, LineChart, BookOpen, MessageSquare, Quote, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import type { StudyMaterial, Progress as ProgressType, SavedDocument, QuizResult } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { MoodTracker } from "@/components/mood-tracker";
import { format } from "date-fns";
import { motion } from "framer-motion";

// Motivational quotes array remains unchanged
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <main className="container py-4 px-3 md:py-8 md:px-6 lg:px-8">
        {user?.username === "joe" && (
          <Alert className="mb-4 md:mb-6 bg-primary/5 border-primary/20">
            <InfoIcon className="h-4 w-4 text-primary" />
            <AlertDescription>
              You are viewing demo data. As you use the platform, this section will be populated with your actual learning progress and insights.
            </AlertDescription>
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 md:space-y-6"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <h1 className="text-2xl md:text-4xl font-bold">Welcome back, {user?.username}!</h1>
          </div>

          {/* Motivational Quote Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex gap-3 md:gap-4 items-start">
                  <Quote className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-base md:text-lg font-medium italic mb-2">{randomQuote.text}</p>
                    <p className="text-sm text-muted-foreground">― {randomQuote.author}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mood Tracker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card>
              <MoodTracker />
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {/* Chat Statistics Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-full"
            >
              <Card className="h-full bg-gradient-to-br from-blue-500/5 to-blue-600/10 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-lg md:text-xl">
                    <MessageSquare className="h-5 w-5" />
                    AI Study Chat Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:gap-4 md:grid-cols-2">
                    <div className="space-y-1 md:space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Chats</p>
                      <p className="text-xl md:text-2xl font-bold">{totalChats}</p>
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Latest Chat</p>
                      {latestChat ? (
                        <div>
                          <p className="text-base md:text-lg font-semibold truncate">{latestChat.title}</p>
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
            </motion.div>

            {/* Quiz Statistics Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-full"
            >
              <Card className="h-full bg-gradient-to-br from-green-500/5 to-green-600/10 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400 text-lg md:text-xl">
                    <Brain className="h-5 w-5" />
                    Quiz Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3">
                    <div className="space-y-1 md:space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Quizzes</p>
                      <p className="text-xl md:text-2xl font-bold">{totalQuizzes}</p>
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                      <p className="text-xl md:text-2xl font-bold">{averageScore}%</p>
                    </div>
                    <div className="space-y-1 md:space-y-2 col-span-2 md:col-span-1">
                      <p className="text-sm font-medium text-muted-foreground">Latest Quiz</p>
                      {latestQuiz ? (
                        <div>
                          <p className="text-xl md:text-2xl font-bold">{latestQuiz.score}%</p>
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
            </motion.div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* AI Learning Assistant */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="w-full"
            >
              <Card
                className="h-full bg-gradient-to-br from-violet-500/5 to-violet-600/10 hover:shadow-lg cursor-pointer transition-all"
                onClick={() => setLocation("/chat")}
              >
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-lg md:text-xl">
                    <Brain className="h-5 w-5" />
                    AI Learning Assistant
                  </CardTitle>
                  <CardDescription>
                    Get personalized help and explanations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Ask questions, get explanations, and receive instant feedback
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Real-time Study Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="w-full"
            >
              <Card
                className="h-full bg-gradient-to-br from-orange-500/5 to-orange-600/10 hover:shadow-lg cursor-pointer transition-all"
                onClick={() => setLocation("/study-tracker")}
              >
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-lg md:text-xl">
                    <Clock className="h-5 w-5" />
                    Study Tracking
                  </CardTitle>
                  <CardDescription>
                    Track your study sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Monitor focus time and build consistent habits
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Analytics & Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="w-full"
            >
              <Card
                className="h-full bg-gradient-to-br from-cyan-500/5 to-cyan-600/10 hover:shadow-lg cursor-pointer transition-all"
                onClick={() => setLocation("/analytics")}
              >
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-lg md:text-xl">
                    <LineChart className="h-5 w-5" />
                    Analytics & Insights
                  </CardTitle>
                  <CardDescription>
                    Track your progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get insights and personalized recommendations
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Progress Section */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {/* Recent Documents */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="w-full"
            >
              <Card className="h-full bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Recent Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {documents?.slice(0, 5).map((doc) => (
                      <motion.div
                        key={doc.id}
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between hover:bg-primary/5 p-2 rounded-lg cursor-pointer"
                        onClick={() => setLocation("/documents")}
                      >
                        <div>
                          <p className="font-medium text-sm md:text-base truncate">{doc.title}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {doc.type} • {format(new Date(doc.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {(!documents || documents.length === 0) && (
                      <p className="text-sm text-muted-foreground">
                        No documents created yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Recommendations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="w-full"
            >
              <Card className="h-full bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 md:space-y-3">
                    {recommendations?.slice(0, 3).map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 * i }}
                        className="p-2 md:p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10"
                      >
                        <p className="text-sm">{rec}</p>
                      </motion.div>
                    ))}
                    {(!recommendations || recommendations.length === 0) && (
                      <p className="text-sm text-muted-foreground">
                        Complete some lessons to get personalized recommendations
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}