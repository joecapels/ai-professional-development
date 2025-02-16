import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
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

  const { data: materials, isLoading } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/materials"],
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

  if (isLoading) {
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

          <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
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

            {/* Study Materials List */}
            <Card>
              <CardHeader>
                <CardTitle>Study Materials</CardTitle>
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
        </div>
      </main>
    </div>
  );
}