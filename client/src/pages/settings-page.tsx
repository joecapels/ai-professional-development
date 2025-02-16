import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { learningPreferencesSchema, type LearningPreferences } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: preferences, isLoading } = useQuery<LearningPreferences>({
    queryKey: ["/api/preferences"],
  });

  const form = useForm<LearningPreferences>({
    resolver: zodResolver(learningPreferencesSchema),
    defaultValues: preferences || {
      learningStyle: "visual",
      pacePreference: "moderate",
      explanationDetail: "detailed",
      exampleFrequency: "moderate",
      chatbotPersonality: "encouraging", // Added default value
      gradeLevel: "high_school", //Added default value
      researchAreas: ["machine_learning"], //Added default value

    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: LearningPreferences) => {
      const res = await apiRequest("POST", "/api/preferences", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({ title: "Settings updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Learning Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  updatePreferencesMutation.mutate(data)
                )}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Educational Level</FormLabel>
                      <FormDescription>
                        Select your current educational level for personalized content
                      </FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your educational level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="elementary_1_3">Elementary School (Grades 1-3)</SelectItem>
                          <SelectItem value="elementary_4_6">Elementary School (Grades 4-6)</SelectItem>
                          <SelectItem value="middle_school">Middle School</SelectItem>
                          <SelectItem value="high_school">High School</SelectItem>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="masters">Master's Degree</SelectItem>
                          <SelectItem value="phd">PhD / Doctoral</SelectItem>
                          <SelectItem value="professional">Professional / Industry</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="researchAreas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Research Areas of Interest</FormLabel>
                      <FormDescription>
                        Select areas you're interested in studying (at least one)
                      </FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select research areas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="machine_learning">Machine Learning</SelectItem>
                          <SelectItem value="deep_learning">Deep Learning</SelectItem>
                          <SelectItem value="natural_language_processing">Natural Language Processing</SelectItem>
                          <SelectItem value="computer_vision">Computer Vision</SelectItem>
                          <SelectItem value="robotics">Robotics</SelectItem>
                          <SelectItem value="reinforcement_learning">Reinforcement Learning</SelectItem>
                          <SelectItem value="data_science">Data Science</SelectItem>
                          <SelectItem value="neural_networks">Neural Networks</SelectItem>
                          <SelectItem value="ai_ethics">AI Ethics</SelectItem>
                          <SelectItem value="quantum_computing">Quantum Computing</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="learningStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Style</FormLabel>
                      <FormDescription>
                        Choose how you prefer to learn new information
                      </FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a learning style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="visual">Visual Learning</SelectItem>
                          <SelectItem value="auditory">Auditory Learning</SelectItem>
                          <SelectItem value="reading">Reading/Writing</SelectItem>
                          <SelectItem value="kinesthetic">Hands-on Learning</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pacePreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Pace</FormLabel>
                      <FormDescription>
                        Set your preferred pace of learning
                      </FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a pace" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fast">Fast</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="slow">Slow</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="explanationDetail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Explanation Detail</FormLabel>
                      <FormDescription>
                        Choose how detailed you want explanations to be
                      </FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select detail level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                          <SelectItem value="comprehensive">Comprehensive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exampleFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Example Frequency</FormLabel>
                      <FormDescription>
                        Set how many examples you'd like to see
                      </FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select example frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="few">Few Examples</SelectItem>
                          <SelectItem value="moderate">Moderate Examples</SelectItem>
                          <SelectItem value="many">Many Examples</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                {/* Add this form field after the exampleFrequency field */}
                <FormField
                  control={form.control}
                  name="chatbotPersonality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chatbot Personality</FormLabel>
                      <FormDescription>
                        Choose how you'd like your AI tutor to interact with you
                      </FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select chatbot personality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="encouraging">Encouraging & Motivating</SelectItem>
                          <SelectItem value="socratic">Socratic Method</SelectItem>
                          <SelectItem value="professional">Professional & Direct</SelectItem>
                          <SelectItem value="friendly">Friendly & Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updatePreferencesMutation.isPending}
                >
                  {updatePreferencesMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Preferences
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}