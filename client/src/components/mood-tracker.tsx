import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const moods = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😌", label: "Calm", value: "calm" },
  { emoji: "😔", label: "Sad", value: "sad" },
  { emoji: "😫", label: "Stressed", value: "stressed" },
  { emoji: "😤", label: "Frustrated", value: "frustrated" },
  { emoji: "🤔", label: "Confused", value: "confused" },
  { emoji: "🔥", label: "Motivated", value: "motivated" },
  { emoji: "😴", label: "Tired", value: "tired" },
];

export function MoodTracker() {
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const moodMutation = useMutation({
    mutationFn: async (mood: string) => {
      const res = await apiRequest("POST", "/api/mood", { mood });
      return res.json();
    },
    onSuccess: (data) => {
      setSuggestion(data.suggestion);
      toast({
        title: "Thanks for sharing your mood!",
        description: "Here's a personalized suggestion for you.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to process mood",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          How are you feeling today?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {moods.map((mood) => (
            <Button
              key={mood.value}
              variant={selectedMood === mood.value ? "default" : "outline"}
              className="h-20 text-center flex flex-col items-center justify-center gap-1 hover:border-primary"
              onClick={() => {
                setSelectedMood(mood.value);
                moodMutation.mutate(mood.value);
              }}
              disabled={moodMutation.isPending}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-xs">{mood.label}</span>
            </Button>
          ))}
        </div>

        {moodMutation.isPending && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {suggestion && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">{suggestion}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
