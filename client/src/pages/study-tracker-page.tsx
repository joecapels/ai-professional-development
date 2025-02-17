import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Loader2, Clock, Brain, LineChart, BookOpen, Trophy, Target } from "lucide-react";
import { format } from "date-fns";

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

  const { data: studyStats, isLoading } = useQuery<StudyStats>({
    queryKey: ["/api/study-stats"],
  });

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
        <div className="container py-6 px-4">
          <h1 className="text-2xl font-bold mb-4">No study data available</h1>
          <p>Start studying to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Study Statistics</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Study Time Stats */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Study Time Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total Study Time</p>
                  <p className="text-2xl font-bold">
                    {studyStats.totalStudyTime} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Session</p>
                  <p className="text-2xl font-bold">
                    {studyStats.avgSessionLength} minutes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Performance */}
          <Card className="bg-gradient-to-br from-green-500/5 to-green-600/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-600" />
                Quiz Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">
                    {studyStats.quizStats.averageScore}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Perfect Scores</p>
                  <p className="text-2xl font-bold">
                    {studyStats.quizStats.perfectScores}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Streak */}
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-600" />
                Study Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">
                    {studyStats.currentStreak} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                  <p className="text-2xl font-bold">
                    {studyStats.maxStreak} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 mt-6 md:grid-cols-2">
          {/* Recent Study Sessions */}
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
                  <div
                    key={session.id}
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
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
                  <div
                    key={doc.id}
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}