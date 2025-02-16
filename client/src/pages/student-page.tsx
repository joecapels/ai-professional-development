import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StudyMaterial, Progress as ProgressType } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function StudentPage() {
  const { user, logoutMutation } = useAuth();

  const { data: materials, isLoading: materialsLoading } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/materials"],
  });

  const { data: progress, isLoading: progressLoading } = useQuery<ProgressType[]>({
    queryKey: ["/api/progress"],
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<string[]>({
    queryKey: ["/api/recommendations"],
  });

  const startStudyMutation = useMutation({
    mutationFn: async (materialId: number) => {
      const res = await apiRequest("POST", "/api/progress", {
        materialId,
        score: Math.floor(Math.random() * 100), // This will be replaced with actual study progress
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
  });

  if (materialsLoading || progressLoading || recommendationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b p-4">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">Study AI</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Study Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {materials?.map((material) => (
                  <Card key={material.id}>
                    <CardContent className="p-4">
                      <h3 className="font-bold mb-2">{material.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {material.subject} | Difficulty: {material.difficulty}
                      </p>
                      <Button
                        onClick={() => startStudyMutation.mutate(material.id)}
                        disabled={startStudyMutation.isPending}
                      >
                        Start Studying
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progress?.map((p) => {
                    const material = materials?.find(m => m.id === p.materialId);
                    return (
                      <div key={p.id} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            {material?.title}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {p.score}%
                          </span>
                        </div>
                        <Progress value={p.score} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations?.map((rec, i) => (
                    <li key={i} className="text-sm">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}