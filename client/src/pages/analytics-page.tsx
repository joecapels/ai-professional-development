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
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

interface AnswerPatterns {
  correctVsIncorrect: { category: string; count: number }[];
  topicAccuracy: { topic: string; accuracy: number }[];
  mistakeFrequency: { mistake: string; count: number }[];
}

interface QuizAnalysis {
  topicBreakdown: {
    topic: string;
    correctAnswers: number;
    totalQuestions: number;
  }[];
  commonMistakes: {
    topic: string;
    description: string;
    frequency: number;
  }[];
  timeOfDayPerformance: {
    timeSlot: string;
    averageScore: number;
  }[];
  answerPatterns: AnswerPatterns;
}

interface DocumentAnalysis {
  topicsDistribution: {
    topic: string;
    count: number;
  }[];
  complexityTrend: {
    month: string;
    averageComplexity: number;
  }[];
  conceptConnections: {
    concept: string;
    relatedConcepts: string[];
    strength: number;
  }[];
}

interface AnalyticsData {
  performanceMetrics: PerformanceMetrics;
  subjectPerformance: SubjectPerformance[];
  nextStepRecommendations: string[];
  quizAnalysis: QuizAnalysis;
  documentAnalysis: DocumentAnalysis;
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
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!analytics || !studyPlan) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  const { performanceMetrics, subjectPerformance, nextStepRecommendations, quizAnalysis, documentAnalysis } = analytics;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Learning Analytics</h1>

          {user?.username === "joe" && (
            <Alert>
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
                <div className="h-[300px] w-full">
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

            {/* Quiz Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Topic Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Topic Performance</h3>
                    <div className="space-y-4">
                      {quizAnalysis.topicBreakdown.map((topic, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{topic.topic}</span>
                            <span>{Math.round((topic.correctAnswers / topic.totalQuestions) * 100)}%</span>
                          </div>
                          <Progress
                            value={(topic.correctAnswers / topic.totalQuestions) * 100}
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time of Day Performance */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Performance by Time of Day</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={quizAnalysis.timeOfDayPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timeSlot" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="averageScore"
                            stroke="hsl(var(--primary))"
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Answer Patterns Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Answer Patterns Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Correct vs Incorrect Distribution */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Answer Distribution</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={quizAnalysis.answerPatterns.correctVsIncorrect}
                            dataKey="count"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="hsl(var(--primary))"
                          >
                            {quizAnalysis.answerPatterns.correctVsIncorrect.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Topic Accuracy */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Topic Accuracy</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quizAnalysis.answerPatterns.topicAccuracy}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="topic" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="accuracy" fill="hsl(var(--primary))">
                            {quizAnalysis.answerPatterns.topicAccuracy.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.accuracy >= 70 ? "hsl(var(--primary))" : "hsl(var(--warning))"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Content Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Topics Distribution */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Content Distribution Analysis</h3>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={documentAnalysis.topicsDistribution}
                            dataKey="count"
                            nameKey="topic"
                            cx="50%"
                            cy="50%"
                            outerRadius={160}
                            fill="hsl(var(--primary))"
                            label={({ topic, percent }) => `${topic} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {documentAnalysis.topicsDistribution.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={`hsl(${(index * 45) % 360}, 70%, 50%)`}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Concept Connections */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Concept Connections</h3>
                    <div className="space-y-4">
                      {documentAnalysis.conceptConnections.map((concept, i) => (
                        <div key={i} className="space-y-2">
                          <p className="font-medium">{concept.concept}</p>
                          <div className="flex flex-wrap gap-2">
                            {concept.relatedConcepts.map((related, j) => (
                              <span
                                key={j}
                                className="px-2 py-1 bg-primary/10 rounded-full text-xs"
                              >
                                {related}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ML-Powered Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Common Mistakes Analysis */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Areas for Improvement</h3>
                    <div className="space-y-4">
                      {quizAnalysis.commonMistakes.map((mistake, i) => (
                        <div key={i} className="p-4 bg-muted rounded-lg">
                          <p className="font-medium mb-2">{mistake.topic}</p>
                          <p className="text-sm text-muted-foreground">{mistake.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Personalized Study Plan */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
                    <div className="space-y-4">
                      {nextStepRecommendations.map((recommendation, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <span className="font-bold text-primary">{i + 1}.</span>
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
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


            {/* Strengths and Improvements */}
            <Card className="h-full">
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
            <Card className="h-full">
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
        </div>
      </main>
    </div>
  );
}