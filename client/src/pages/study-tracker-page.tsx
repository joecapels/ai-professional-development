import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Loader2, Clock, Brain, LineChart, BookOpen, Trophy, Target, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

interface StudyStats {
  totalStudyTime: number;
  avgSessionLength: number;
  totalSessions: number;
  currentStreak: number;
  maxStreak: number;
  quizStats: {
    totalQuizzes: number;
    averageScore: number;
    perfectScores: number;
  };
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

      const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'start',
          data: {
            subject: 'General'
          }
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'session_started') {
          toast({
            title: "Study Session Started",
            description: "Your study session has begun. Good luck!",
          });
          setLocation(`/study-session/${message.sessionId}`);
        } else if (message.type === 'error') {
          toast({
            title: "Error Starting Session",
            description: message.message,
            variant: "destructive",
          });
        }
      };

      ws.onerror = () => {
        toast({
          title: "Connection Error",
          description: "Failed to connect to study session. Please try again.",
          variant: "destructive",
        });
      };
    } catch (error) {
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
          <h1 className="text-2xl font-bold mb-4">Welcome to Study Tracking!</h1>
          <p className="text-muted-foreground mb-6">Start your learning journey by completing your first study session.</p>
          <Button 
            className="flex items-center gap-2"
            onClick={startSession}
          >
            <Clock className="h-4 w-4" />
            Begin Study Session
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6 px-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Study Statistics</h1>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Set Daily Goal
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Set your daily study targets to stay on track
            </TooltipContent>
          </Tooltip>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Study Time Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-sm text-muted-foreground">Total Study Time</p>
                      <p className="text-2xl font-bold">
                        {studyStats.totalStudyTime} minutes
                      </p>
                    </motion.div>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p className="text-sm text-muted-foreground">Average Session</p>
                      <p className="text-2xl font-bold">
                        {studyStats.avgSessionLength} minutes
                      </p>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-green-500/5 to-green-600/10 hover:from-green-500/10 hover:to-green-600/15 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-green-600" />
                    Quiz Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold">
                        {studyStats.quizStats.averageScore}%
                      </p>
                    </motion.div>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <p className="text-sm text-muted-foreground">Perfect Scores</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">
                          {studyStats.quizStats.perfectScores}
                        </p>
                        {studyStats.quizStats.perfectScores > 0 && (
                          <Sparkles className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 hover:from-blue-500/10 hover:to-blue-600/15 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-blue-600" />
                    Study Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                      <p className="text-2xl font-bold">
                        {studyStats.currentStreak} days
                      </p>
                    </motion.div>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className="text-sm text-muted-foreground">Best Streak</p>
                      <p className="text-2xl font-bold">
                        {studyStats.maxStreak} days
                      </p>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="grid gap-6 mt-6 md:grid-cols-2">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Recent Study Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studyStats.recentSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10"
                      >
                        <div>
                          <p className="font-medium">{session.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(session.startTime), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{session.totalDuration} minutes</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {session.status}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
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
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10"
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
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}