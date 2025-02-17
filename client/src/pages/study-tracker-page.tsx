import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Loader2, Clock, Brain, LineChart } from "lucide-react";
import type { StudySession } from "@shared/schema";
import { format } from "date-fns";

export default function StudyTrackerPage() {
  const { user } = useAuth();

  const { data: studySessions, isLoading } = useQuery<StudySession[]>({
    queryKey: ["/api/study-sessions"],
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

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Study Tracking</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Stats Cards */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Total Study Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {studySessions?.reduce((acc, session) => acc + (session.duration || 0), 0)} minutes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-600/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-600" />
                Focus Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {studySessions?.length || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-600" />
                Average Session Length
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {studySessions?.length
                  ? Math.round(
                      studySessions.reduce((acc, session) => acc + (session.duration || 0), 0) /
                        studySessions.length
                    )
                  : 0}{" "}
                minutes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Study Sessions List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Study Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studySessions?.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10"
                >
                  <div>
                    <p className="font-medium">{session.subject || "Study Session"}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.startTime), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{session.duration} minutes</p>
                    <p className="text-sm text-muted-foreground">
                      {session.status}
                    </p>
                  </div>
                </div>
              ))}
              {(!studySessions || studySessions.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No study sessions recorded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
