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
import { useEffect } from "react";
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

  // Only set default values if no preferences exist
  const defaultValues: LearningPreferences = preferences || {
    learningStyle: "visual",
    pacePreference: "moderate",
    explanationDetail: "detailed",
    exampleFrequency: "moderate",
    chatbotPersonality: "encouraging",
    gradeLevel: "high_school",
    researchAreas: ["computer_science"]
  };

  const form = useForm<LearningPreferences>({
    resolver: zodResolver(learningPreferencesSchema),
    defaultValues,
    values: preferences || defaultValues,
  });

  // Reset form when preferences are loaded
  useEffect(() => {
    if (preferences) {
      form.reset(preferences);
    }
  }, [preferences, form]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: LearningPreferences) => {
      console.log("Submitting preferences:", data);
      const response = await apiRequest("POST", "/api/preferences", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update preferences");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({ 
        title: "Settings updated successfully",
        description: "Your learning preferences have been saved."
      });
    },
    onError: (error: Error) => {
      console.error("Preferences update error:", error);
      toast({
        title: "Failed to update settings",
        description: error.message || "Please try again later",
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
                {/* Grade Level Selection */}
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

                {/* Research Areas Selection */}
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
                        onValueChange={(value) => field.onChange([value])}
                        value={field.value?.[0]}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select research areas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {/* Sciences */}
                          <SelectItem value="biology">Biology</SelectItem>
                          <SelectItem value="chemistry">Chemistry</SelectItem>
                          <SelectItem value="physics">Physics</SelectItem>
                          <SelectItem value="environmental_science">Environmental Science</SelectItem>

                          {/* Technology & Computing */}
                          <SelectItem value="computer_science">Computer Science</SelectItem>
                          <SelectItem value="artificial_intelligence">Artificial Intelligence</SelectItem>
                          <SelectItem value="data_science">Data Science</SelectItem>
                          <SelectItem value="robotics">Robotics</SelectItem>

                          {/* Mathematics */}
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="statistics">Statistics</SelectItem>
                          <SelectItem value="algebra">Algebra</SelectItem>
                          <SelectItem value="calculus">Calculus</SelectItem>

                          {/* Social Sciences */}
                          <SelectItem value="psychology">Psychology</SelectItem>
                          <SelectItem value="sociology">Sociology</SelectItem>
                          <SelectItem value="economics">Economics</SelectItem>
                          <SelectItem value="political_science">Political Science</SelectItem>

                          {/* Humanities */}
                          <SelectItem value="history">History</SelectItem>
                          <SelectItem value="philosophy">Philosophy</SelectItem>
                          <SelectItem value="literature">Literature</SelectItem>
                          <SelectItem value="linguistics">Linguistics</SelectItem>

                          {/* Arts */}
                          <SelectItem value="visual_arts">Visual Arts</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="performing_arts">Performing Arts</SelectItem>
                          <SelectItem value="design">Design</SelectItem>

                          {/* Health & Medicine */}
                          <SelectItem value="medicine">Medicine</SelectItem>
                          <SelectItem value="anatomy">Anatomy</SelectItem>
                          <SelectItem value="public_health">Public Health</SelectItem>
                          <SelectItem value="nutrition">Nutrition</SelectItem>

                          {/* Business */}
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="management">Management</SelectItem>

                          {/* Other Fields */}
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="architecture">Architecture</SelectItem>
                          <SelectItem value="law">Law</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Learning Style Selection */}
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

                {/* Learning Pace Selection */}
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

                {/* Explanation Detail Selection */}
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

                {/* Example Frequency Selection */}
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

                {/* Chatbot Personality Selection */}
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

                {/* Submit Button */}
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