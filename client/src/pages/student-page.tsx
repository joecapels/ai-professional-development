import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Brain, Clock, LineChart, BookOpen, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import type { StudyMaterial, Progress as ProgressType } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

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

  if (materialsLoading || progressLoading || recommendationsLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

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

        <h1 className="text-4xl font-bold mb-8">Welcome back, {user?.username}!</h1>

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
          {/* Study Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recent Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materials?.slice(0, 3).map((material) => (
                  <div key={material.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{material.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {material.subject} • Level {material.difficulty}
                      </p>
                    </div>
                  </div>
                ))}
                {(!materials || materials.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No study materials available yet
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