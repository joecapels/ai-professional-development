import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Brain, Sparkles, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/nav-bar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SavedDocument } from "@shared/schema";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  difficulty: number;
}

export default function FlashcardPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [flipped, setFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: documents, isLoading: documentsLoading } = useQuery<SavedDocument[]>({
    queryKey: ["/api/documents"],
  });

  const { data: flashcards, isLoading: flashcardsLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards"],
  });

  const generateCardsMutation = useMutation({
    mutationFn: async () => {
      if (selectedDocs.length === 0) {
        throw new Error("Please select at least one document");
      }
      setIsGenerating(true);
      const res = await apiRequest("POST", "/api/flashcards/generate", {
        documentIds: selectedDocs
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({ title: "New flashcards generated successfully" });
      setIsGenerating(false);
      setSelectedDocs([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate flashcards",
        description: error.message,
        variant: "destructive"
      });
      setIsGenerating(false);
    },
  });

  const toggleDocument = (docId: number) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const nextCard = () => {
    setFlipped(false);
    setTimeout(() => {
      if (flashcards && currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        setCurrentCardIndex(0);
      }
    }, 300); // Match the exit animation duration
  };

  if (documentsLoading || flashcardsLoading) {
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
        </div>

        {/* Document Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Select Documents for Flashcards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents?.map((doc) => (
                <div key={doc.id} className="flex items-center space-x-3">
                  <Checkbox 
                    id={`doc-${doc.id}`}
                    checked={selectedDocs.includes(doc.id)}
                    onCheckedChange={() => toggleDocument(doc.id)}
                  />
                  <label 
                    htmlFor={`doc-${doc.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {doc.title}
                  </label>
                </div>
              ))}
              {(!documents || documents.length === 0) && (
                <p className="text-muted-foreground">
                  No documents available. Upload some documents first!
                </p>
              )}
              <Button
                onClick={() => generateCardsMutation.mutate()}
                disabled={isGenerating || selectedDocs.length === 0}
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Cards
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Flashcard Display */}
        {flashcards && flashcards.length > 0 ? (
          <div className="space-y-6">
            <div className="relative h-[400px] perspective-[1000px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCardIndex + (flipped ? "-back" : "-front")}
                  initial={{ rotateY: flipped ? -180 : 0, opacity: 0 }}
                  animate={{ rotateY: flipped ? 0 : 180, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden"
                  }}
                  className="absolute inset-0"
                >
                  <Card
                    className={`h-full w-full cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg transition-all transform-gpu
                      ${flipped ? "rotate-y-180" : ""}`}
                    onClick={() => setFlipped(!flipped)}
                  >
                    <CardContent className="flex items-center justify-center h-full p-8">
                      <motion.div
                        className="text-center"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <p className="text-xl">{flipped ? flashcards[currentCardIndex].back : flashcards[currentCardIndex].front}</p>
                        <p className="text-sm text-muted-foreground mt-4">
                          Click to {flipped ? "hide" : "show"} answer
                        </p>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-32"
                  onClick={() => nextCard()}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Next
                </Button>
              </motion.div>
              {flipped && (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-32 text-red-500 hover:text-red-600"
                      onClick={() => nextCard()}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Hard
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-32 text-green-500 hover:text-green-600"
                      onClick={() => nextCard()}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Easy
                    </Button>
                  </motion.div>
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
              No flashcards available. Select some documents and click "Generate Cards" to create flashcards from your study materials!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}