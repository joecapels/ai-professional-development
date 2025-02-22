import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import {
  Loader2,
  Clock,
  Brain,
  LineChart,
  BookOpen,
  Trophy,
  Target,
  Sparkles,
  Sun,
  Moon,
  Sunset,
  BookType,
  Laptop,
  Video,
  Headphones,
  PenTool,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";

interface StudyStats {
  totalStudyTime: number;
  avgSessionLength: number;
  totalSessions: number;
  currentStreak: number;
  maxStreak: number;
  studyPatterns: Record<string, number>;
  subjectAnalysis: Record<string, number>;
  learningPreferences: {
    learningStyle: string;
    pacePreference: string;
    explanationDetail: string;
    exampleFrequency: string;
    chatbotPersonality: string;
    gradeLevel: string;
    researchAreas: string[];
  };
  learningStylesUsage: Record<string, number>;
  quizStats: {
    totalQuizzes: number;
    averageScore: number;
    perfectScores: number;
    bySubject: Record<string, { attempts: number; avgScore: number }>;
  };
  flashcardAnalysis: Record<string, number>;
  documentStats: {
    totalDocuments: number;
    byType: Record<string, number>;
    recentActivity: Array<{
      id: number;
      title: string;
      type: string;
      createdAt: string;
    }>;
  };
  recentSessions: Array<{
    id: number;
    subject: string;
    startTime: string;
    totalDuration: number;
    status: "active" | "paused" | "completed";
  }>;
}

const timeOfDayIcons = {
  morning: <Sun className="h-4 w-4" />,
  afternoon: <Sun className="h-4 w-4" />,
  evening: <Sunset className="h-4 w-4" />,
  night: <Moon className="h-4 w-4" />,
};

const learningStyleIcons = {
  visual: <Video className="h-4 w-4" />,
  auditory: <Headphones className="h-4 w-4" />,
  reading: <BookType className="h-4 w-4" />,
  kinesthetic: <PenTool className="h-4 w-4" />,
  digital: <Laptop className="h-4 w-4" />,
};

export default function StudyTrackerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const wsRef = useRef<WebSocket | null>(null);

  const { data: studyStats, isLoading } = useQuery<StudyStats>({
    queryKey: ["/api/study-stats"],
  });

  const startSession = async () => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }

      const ws = new WebSocket(
        `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
          window.location.host
        }/ws`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "start",
          timestamp: new Date().toISOString(),
          data: {
            subject: "General",
            startTime: new Date().toISOString(),
          },
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "session_started") {
          toast({
            title: "Study Session Started",
            description: "Your study session has begun. Good luck!",
          });
          setLocation(`/study-session/${message.sessionId}`);
        } else if (message.type === "error") {
          toast({
            title: "Error Starting Session",
            description: message.message,
            variant: "destructive",
          });
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection Error",
          description:
            "Failed to connect to study session. Please try again.",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Failed to start study session. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!studyStats) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container py-6 px-4"
        >
          <h1 className="text-2xl font-bold mb-4">Welcome to Study Analytics!</h1>
          <p className="text-muted-foreground mb-6">
            Start your learning journey to see detailed analytics about your study habits.
          </p>
          <Button className="flex items-center gap-2" onClick={startSession}>
            <Clock className="h-4 w-4" />
            Begin Study Session
          </Button>
        </motion.div>
      </div>
    );
  }

  const studyPatternsData = Object.entries(studyStats.studyPatterns).map(([time, count]) => ({
    name: time,
    value: count,
  }));

  const subjectData = Object.entries(studyStats.subjectAnalysis).map(([subject, count]) => ({
    name: subject,
    value: count,
  }));

  const learningStylesData = Object.entries(studyStats.learningStylesUsage).map(([style, count]) => ({
    name: style,
    value: count,
  }));

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6 px-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <LineChart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Learning Analytics</h1>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={startSession}
          >
            <Clock className="h-4 w-4" />
            New Session
          </Button>
        </motion.div>

        {/* Learning Preferences Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Learning Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Learning Style</p>
                <div className="flex items-center gap-2 mt-1">
                  {learningStyleIcons[
                    studyStats.learningPreferences.learningStyle as keyof typeof learningStyleIcons
                  ]}
                  <span className="capitalize">
                    {studyStats.learningPreferences.learningStyle}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pace Preference</p>
                <span className="capitalize">
                  {studyStats.learningPreferences.pacePreference}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Research Areas</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {studyStats.learningPreferences.researchAreas.map((area) => (
                    <Badge key={area} variant="outline" className="capitalize">
                      {area.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Study Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyPatternsData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="var(--primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subject Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Top Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectData.slice(0, 5).map(({ name, value }) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="capitalize">{name}</span>
                    <Badge variant="secondary">{value} sessions</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quiz and Flashcard Analysis */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Quiz Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(studyStats.quizStats.bySubject).map(([subject, stats]) => (
                  <div key={subject} className="flex items-center justify-between">
                    <div>
                      <p className="capitalize">{subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.attempts} attempts
                      </p>
                    </div>
                    <Badge
                      variant={stats.avgScore >= 90 ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {stats.avgScore}%
                      {stats.avgScore >= 90 && (
                        <Sparkles className="h-3 w-3" />
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookType className="h-5 w-5 text-primary" />
                Flashcard Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(studyStats.flashcardAnalysis).map(([topic, count]) => (
                  <Badge
                    key={topic}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {topic} <span className="text-muted-foreground">({count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studyStats.recentSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted"
                  >
                    <div>
                      <p className="font-medium">{session.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.startTime), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <Badge variant={session.status === "completed" ? "default" : "outline"}>
                      {session.totalDuration} min
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studyStats.documentStats.recentActivity.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted"
                  >
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {doc.type}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(doc.createdAt), "MMM d, yyyy")}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}