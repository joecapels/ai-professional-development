import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, Sparkles, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/nav-bar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  difficulty: number;
}

export default function FlashcardPage() {
  const { toast } = useToast();
  const [flipped, setFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const { data: flashcards, isLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards"],
  });

  const generateCardsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/flashcards/generate");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "New flashcards generated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate flashcards",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const currentCard = flashcards?.[currentCardIndex];

  const nextCard = () => {
    setFlipped(false);
    setTimeout(() => {
      if (flashcards && currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        setCurrentCardIndex(0);
      }
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">AI Flashcards</h1>
          </div>
          <Button
            onClick={() => generateCardsMutation.mutate()}
            disabled={generateCardsMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {generateCardsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Cards
          </Button>
        </div>

        {currentCard ? (
          <div className="space-y-6">
            <div className="relative h-[400px] perspective-1000">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCardIndex + (flipped ? "-back" : "-front")}
                  initial={{ rotateY: flipped ? -180 : 0, opacity: 0 }}
                  animate={{ rotateY: flipped ? 0 : 180, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <Card
                    className="h-full w-full cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-shadow"
                    onClick={() => setFlipped(!flipped)}
                  >
                    <CardContent className="flex items-center justify-center h-full p-8">
                      <div className="text-center">
                        <p className="text-xl">{flipped ? currentCard.back : currentCard.front}</p>
                        <p className="text-sm text-muted-foreground mt-4">
                          Click to {flipped ? "hide" : "show"} answer
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="w-32"
                onClick={() => nextCard()}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Next
              </Button>
              {flipped && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-32 text-red-500 hover:text-red-600"
                    onClick={() => nextCard()}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Hard
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-32 text-green-500 hover:text-green-600"
                    onClick={() => nextCard()}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Easy
                  </Button>
                </>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Card {currentCardIndex + 1} of {flashcards.length}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No flashcards available. Click "Generate Cards" to create some from your study materials!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
