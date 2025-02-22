import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { PracticeProblem, ProblemSubmission } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function PracticeProblemsPage() {
  const { toast } = useToast();
  const [selectedProblem, setSelectedProblem] = useState<PracticeProblem | null>(null);
  const [solution, setSolution] = useState("");

  const { data: problems, isLoading: problemsLoading } = useQuery<PracticeProblem[]>({
    queryKey: ["/api/practice-problems"],
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery<ProblemSubmission[]>({
    queryKey: ["/api/problem-submissions"],
  });

  const handleSubmit = async () => {
    if (!selectedProblem) return;

    try {
      const response = await fetch("/api/problem-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          submission: solution,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit solution");

      const result = await response.json();
      
      if (result.isCorrect) {
        toast({
          title: "Success!",
          description: "Your solution passed all test cases.",
        });
      } else {
        toast({
          title: "Almost there!",
          description: "Some test cases failed. Check the feedback below.",
          variant: "destructive",
        });
      }

      // Refresh submissions data
      queryClient.invalidateQueries({ queryKey: ["/api/problem-submissions"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit solution. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (problemsLoading || submissionsLoading) {
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
      <main className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Practice Problems</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Problems List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Available Problems</h2>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="coding">Coding</TabsTrigger>
                <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
                <TabsTrigger value="debugging">Debugging</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {problems?.map((problem) => (
                  <Card
                    key={problem.id}
                    className={`cursor-pointer transition-colors ${
                      selectedProblem?.id === problem.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedProblem(problem)}
                  >
                    <CardHeader>
                      <CardTitle>{problem.title}</CardTitle>
                      <CardDescription>
                        {problem.type} • {problem.difficulty} • {problem.topic}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </TabsContent>

              {["coding", "algorithm", "debugging"].map((type) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {problems
                    ?.filter((p) => p.type === type)
                    .map((problem) => (
                      <Card
                        key={problem.id}
                        className={`cursor-pointer transition-colors ${
                          selectedProblem?.id === problem.id ? "border-primary" : ""
                        }`}
                        onClick={() => setSelectedProblem(problem)}
                      >
                        <CardHeader>
                          <CardTitle>{problem.title}</CardTitle>
                          <CardDescription>
                            {problem.difficulty} • {problem.topic}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Problem Details and Solution */}
          <div className="space-y-6">
            {selectedProblem ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedProblem.title}</CardTitle>
                    <CardDescription>
                      {selectedProblem.type} • {selectedProblem.difficulty} • {selectedProblem.topic}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-sm">{selectedProblem.description}</p>
                    </div>

                    {selectedProblem.hints && (
                      <div>
                        <h3 className="font-semibold mb-2">Hints</h3>
                        <ul className="list-disc list-inside text-sm">
                          {selectedProblem.hints.map((hint, i) => (
                            <li key={i}>{hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold mb-2">Your Solution</h3>
                      <Textarea
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        placeholder="Write your solution here..."
                        className="h-[200px] font-mono"
                      />
                    </div>

                    <Button onClick={handleSubmit} className="w-full">
                      Submit Solution
                    </Button>
                  </CardContent>
                </Card>

                {/* Previous Submissions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {submissions
                        ?.filter((sub) => sub.problemId === selectedProblem.id)
                        .map((submission) => (
                          <div
                            key={submission.id}
                            className={`p-4 rounded-lg ${
                              submission.isCorrect
                                ? "bg-green-500/10 text-green-700"
                                : "bg-red-500/10 text-red-700"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">
                                {submission.isCorrect ? "Passed" : "Failed"}
                              </span>
                              <span className="text-sm">
                                {new Date(submission.submittedAt).toLocaleString()}
                              </span>
                            </div>
                            {submission.feedback && (
                              <div className="text-sm space-y-2">
                                {submission.feedback.map((fb, i) => (
                                  <div key={i}>
                                    <p>Test Case {fb.testCase + 1}:</p>
                                    <p className="font-mono text-xs">{fb.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a problem to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
