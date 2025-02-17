import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { 
  Loader2, Users, BookOpen, Trophy, Activity,
  MessageSquare, Brain, Clock, FileText, 
  BarChart2, ArrowUpDown
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { StudyMaterial, User } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";

interface UserStats {
  chatCount: number;
  quizCount: number;
  studySessionCount: number;
  averageSessionDuration: number;
  totalDocuments: number;
  totalFlashcards: number;
  achievements: number;
}

interface AdminAnalytics {
  activeSessions: number;
  totalAchievements: number;
  totalUsers: number;
  userStats: Record<number, UserStats>;
  aggregateStats: {
    chatCount: number;
    quizCount: number;
    studySessionCount: number;
    averageSessionDuration: number;
    totalDocuments: number;
    totalFlashcards: number;
  };
}

export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch data
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: materials, isLoading: materialsLoading } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/materials"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AdminAnalytics>({
    queryKey: ["/api/admin/analytics"],
  });

  const form = useForm<StudyMaterial>({
    defaultValues: {
      title: "",
      content: "",
      subject: "",
      difficulty: 1,
    },
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (data: Partial<StudyMaterial>) => {
      const res = await apiRequest("POST", "/api/materials", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Study material created successfully" });
      form.reset();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create study material", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  if (usersLoading || materialsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Format duration in minutes
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>

          {/* Primary Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Materials</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{materials?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeSessions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Achievements</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalAchievements || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Sessions</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">
                  {analytics?.aggregateStats.studySessionCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg. Duration: {formatDuration(analytics?.aggregateStats.averageSessionDuration || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Content</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Documents:</span>
                  <span className="font-bold">{analytics?.aggregateStats.totalDocuments || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Flashcards:</span>
                  <span className="font-bold">{analytics?.aggregateStats.totalFlashcards || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assessment Stats</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quizzes Taken:</span>
                  <span className="font-bold">{analytics?.aggregateStats.quizCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Chat Interactions:</span>
                  <span className="font-bold">{analytics?.aggregateStats.chatCount || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 grid-cols-1">
            {/* User Management Table */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead className="text-right">Study Sessions</TableHead>
                        <TableHead className="text-right">Avg. Session Duration</TableHead>
                        <TableHead className="text-right">Quizzes</TableHead>
                        <TableHead className="text-right">Documents</TableHead>
                        <TableHead className="text-right">Flashcards</TableHead>
                        <TableHead className="text-right">Achievements</TableHead>
                        <TableHead className="text-right">Chat Interactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
                            }`}>
                              {user.isAdmin ? 'Admin' : 'Student'}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">{analytics?.userStats[user.id]?.studySessionCount || 0}</TableCell>
                          <TableCell className="text-right">
                            {formatDuration(analytics?.userStats[user.id]?.averageSessionDuration || 0)}
                          </TableCell>
                          <TableCell className="text-right">{analytics?.userStats[user.id]?.quizCount || 0}</TableCell>
                          <TableCell className="text-right">{analytics?.userStats[user.id]?.totalDocuments || 0}</TableCell>
                          <TableCell className="text-right">{analytics?.userStats[user.id]?.totalFlashcards || 0}</TableCell>
                          <TableCell className="text-right">{analytics?.userStats[user.id]?.achievements || 0}</TableCell>
                          <TableCell className="text-right">{analytics?.userStats[user.id]?.chatCount || 0}</TableCell>
                        </TableRow>
                      ))}
                      {(!users || users.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={10} className="h-24 text-center">
                            No users found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Study Materials Management */}
            <Card>
              <CardHeader>
                <CardTitle>Study Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit((data) => createMaterialMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input {...form.register("title")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input {...form.register("subject")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Content</label>
                    <Textarea {...form.register("content")} rows={6} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty (1-5)</label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      {...form.register("difficulty", { valueAsNumber: true })}
                    />
                  </div>
                  <Button type="submit" disabled={createMaterialMutation.isPending}>
                    {createMaterialMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Material
                  </Button>
                </form>

                <div className="mt-6 space-y-4">
                  {materials?.map((material) => (
                    <div
                      key={material.id}
                      className="p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <h3 className="font-bold">{material.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Subject: {material.subject} • Difficulty: {material.difficulty}
                      </p>
                    </div>
                  ))}
                  {(!materials || materials.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      No study materials available.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}