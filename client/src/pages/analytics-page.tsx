import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface PerformanceMetrics {
  overallScore: number;
  strengthAreas: string[];
  improvementAreas: string[];
  learningTrends: {
    period: string;
    score: number;
  }[];
  recommendedTopics: string[];
  predictedDifficulty: number;
}

interface SubjectPerformance {
  subject: string;
  averageScore: number;
  totalAttempts: number;
  lastAttemptDate: string;
  improvement: number;
}

interface StudyPlan {
  dailyGoals: string[];
  focusAreas: string[];
  estimatedTimeInvestment: number;
  milestones: {
    description: string;
    targetDate: string;
  }[];
}

interface AnalyticsData {
  performanceMetrics: PerformanceMetrics;
  subjectPerformance: SubjectPerformance[];
  nextStepRecommendations: string[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  const { data: studyPlan, isLoading: planLoading } = useQuery<StudyPlan>({
    queryKey: ["/api/study-plan"],
  });

  if (analyticsLoading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics || !studyPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No analytics data available</p>
      </div>
    );
  }

  const { performanceMetrics, subjectPerformance, nextStepRecommendations } = analytics;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-8">
        {user?.username === "joe" && (
          <Alert className="mb-6">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              You are viewing demo analytics data. As you use the platform, this section will be populated with your actual learning progress and personalized insights.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-6">
          {/* Overall Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceMetrics.learningTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={subjectPerformance}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Score"
                      dataKey="averageScore"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Strengths and Improvements */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Strength Areas</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {performanceMetrics.strengthAreas.map((area, i) => (
                        <li key={i} className="text-sm">{area}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Areas for Improvement</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {performanceMetrics.improvementAreas.map((area, i) => (
                        <li key={i} className="text-sm">{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Personalized Study Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Daily Goals</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {studyPlan.dailyGoals.map((goal, i) => (
                        <li key={i} className="text-sm">{goal}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Focus Areas</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {studyPlan.focusAreas.map((area, i) => (
                        <li key={i} className="text-sm">{area}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Milestones</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {studyPlan.milestones.map((milestone, i) => (
                        <li key={i} className="text-sm">
                          {milestone.description} (Target: {new Date(milestone.targetDate).toLocaleDateString()})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                {nextStepRecommendations.map((rec, i) => (
                  <li key={i} className="text-sm">{rec}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}