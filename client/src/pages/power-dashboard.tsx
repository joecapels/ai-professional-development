import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2, Users, Brain, Trophy, Target, BookOpen, TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";

interface AnalyticsData {
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    userGrowth: Array<{ date: string; count: number }>;
  };
  learningMetrics: {
    averageStudyTime: number;
    totalQuizzesTaken: number;
    averageQuizScore: number;
    subjectDistribution: Array<{ subject: string; count: number }>;
  };
  achievementMetrics: {
    totalBadgesAwarded: number;
    popularBadges: Array<{ name: string; count: number }>;
    completionRates: Array<{ badge: string; rate: number }>;
  };
  engagementMetrics: {
    averageSessionLength: number;
    peakActivityHours: Array<{ hour: number; count: number }>;
    featureUsage: Array<{ feature: string; usage: number }>;
  };
}

export default function PowerDashboardPage() {
  const { user } = useAuth();
  
  // Redirect if not a power user
  if (!user?.isPowerUser) {
    return <Redirect to="/power-login" />;
  }

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/power/analytics"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Platform Analytics Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.userMetrics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{analytics.userMetrics.newUsersToday} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.userMetrics.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                Currently online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Quiz Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.learningMetrics.averageQuizScore}%
              </div>
              <p className="text-xs text-muted-foreground">
                From {analytics.learningMetrics.totalQuizzesTaken} quizzes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges Awarded</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.achievementMetrics.totalBadgesAwarded}
              </div>
              <p className="text-xs text-muted-foreground">
                Total achievements earned
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.userMetrics.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Feature Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.engagementMetrics.featureUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional analytics sections can be added here */}
      </main>
    </div>
  );
}
