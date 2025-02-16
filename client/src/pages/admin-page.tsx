import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Loader2, Users, BookOpen, Clock, LineChart } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { StudyMaterial, InsertUser } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { useLocation } from "wouter";

export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  if (user && !user.isAdmin) {
    setLocation("/");
    return null;
  }

  const { data: materials, isLoading: materialsLoading } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/materials"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["/api/admin/usage"],
  });

  const materialForm = useForm<StudyMaterial>({
    defaultValues: {
      title: "",
      content: "",
      subject: "",
      difficulty: 1,
    },
  });

  const adminForm = useForm<InsertUser & { isAdmin: boolean }>({
    defaultValues: {
      username: "",
      password: "",
      isAdmin: true,
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
      materialForm.reset();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create study material", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: InsertUser & { isAdmin: boolean }) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Admin user created successfully" });
      adminForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create admin user",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  if (materialsLoading || usersLoading || usageLoading) {
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
      <main className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>

          {/* Overview Statistics */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users?.length || 0}</div>
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
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage?.activeSessions || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Study Hours</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage?.totalHours || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* User Management Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Overview of all registered users and their activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users?.map((user) => (
                  <div key={user.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{user.username}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user.isAdmin ? "Admin" : "Student"} • Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Last Active</p>
                        <p className="text-sm text-muted-foreground">
                          {user.lastActive ? new Date(user.lastActive).toLocaleString() : "Never"}
                        </p>
                      </div>
                    </div>
                    {user.learningPreferences && (
                      <div className="mt-2 text-sm">
                        <p>Grade Level: {user.learningPreferences.gradeLevel}</p>
                        <p>Research Areas: {user.learningPreferences.researchAreas?.join(", ")}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
            {/* Study Material Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Study Material</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={materialForm.handleSubmit((data) => createMaterialMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input {...materialForm.register("title")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input {...materialForm.register("subject")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Content</label>
                    <Textarea {...materialForm.register("content")} rows={6} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty (1-5)</label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      {...materialForm.register("difficulty", { valueAsNumber: true })}
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

            {/* Admin Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Admin User</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={adminForm.handleSubmit((data) => createAdminMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <Input {...adminForm.register("username")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <Input 
                      type="password" 
                      {...adminForm.register("password")}
                    />
                  </div>
                  <Button type="submit" disabled={createAdminMutation.isPending}>
                    {createAdminMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Admin User
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}