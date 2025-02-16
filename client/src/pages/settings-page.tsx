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
