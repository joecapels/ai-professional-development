import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Loader2, Users, BookOpen, BarChart2, Brain } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { StudyMaterial } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch study materials
  const { data: materials, isLoading: materialsLoading } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/materials"],
  });

  // Fetch analytics data with explicit typing
  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    totalUsers: number;
    activeSessions: number;
    averagePerformance: string;
    users: Array<{
      id: number;
      username: string;
      isAdmin: boolean;
      lastActive: string;
    }>;
    performanceMetrics: Array<{
      title: string;
      value: number;
      description: string;
    }>;
  }>({
    queryKey: ["/api/analytics"],
    staleTime: 30000, // Refresh every 30 seconds
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

  if (materialsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Default values for analytics to prevent undefined errors
  const defaultAnalytics = {
    totalUsers: 0,
    activeSessions: 0,
    averagePerformance: '0%',
    users: [],
    performanceMetrics: []
  };

  const mergedAnalytics = { ...defaultAnalytics, ...analytics };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <span className="text-sm text-muted-foreground">
              Welcome back, {user?.username}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mergedAnalytics.totalUsers}</div>
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
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mergedAnalytics.activeSessions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mergedAnalytics.averagePerformance}</div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full">
            <Tabs defaultValue="materials" className="w-full">
              <TabsList className="w-full justify-start border-b mb-4">
                <TabsTrigger value="materials" className="px-4 py-2">Study Materials</TabsTrigger>
                <TabsTrigger value="users" className="px-4 py-2">User Management</TabsTrigger>
                <TabsTrigger value="analytics" className="px-4 py-2">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="materials" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Study Material</CardTitle>
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
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Study Materials List</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
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
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium">Username</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Last Active</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {mergedAnalytics.users?.map((user) => (
                            <tr key={user.id}>
                              <td className="px-4 py-3 text-sm">{user.username}</td>
                              <td className="px-4 py-3 text-sm">{user.isAdmin ? 'Admin' : 'Student'}</td>
                              <td className="px-4 py-3 text-sm">{new Date(user.lastActive).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-sm">
                                <Button variant="ghost" size="sm">View Details</Button>
                              </td>
                            </tr>
                          ))}
                          {(!mergedAnalytics.users || mergedAnalytics.users.length === 0) && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                No users found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {mergedAnalytics.performanceMetrics.map((metric, index) => (
                        <div key={index} className="space-y-2">
                          <h3 className="font-medium">{metric.title}</h3>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">{metric.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}