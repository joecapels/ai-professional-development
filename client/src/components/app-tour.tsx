import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  page: string;
}

const tourSteps: TourStep[] = [
  {
    target: "[data-tour='dashboard']",
    title: "Welcome to Your Dashboard",
    description: "This is your central hub for tracking progress and accessing all features.",
    position: "bottom",
    page: "/"
  },
  {
    target: "[data-tour='learn']",
    title: "Interactive Learning",
    description: "Engage in AI-powered conversations to enhance your understanding.",
    position: "bottom",
    page: "/chat"
  },
  {
    target: "[data-tour='practice']",
    title: "Practice Your Knowledge",
    description: "Test your understanding with interactive quizzes and exercises.",
    position: "bottom",
    page: "/quiz"
  },
  {
    target: "[data-tour='flashcards']",
    title: "Flashcard Review",
    description: "Review key concepts with our spaced repetition system.",
    position: "bottom",
    page: "/flashcards"
  },
  {
    target: "[data-tour='achievements']",
    title: "Track Your Achievements",
    description: "View your earned badges and progress milestones.",
    position: "bottom",
    page: "/badges"
  }
];

export function AppTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [location] = useLocation();
  const [targetElement, setTargetElement] = useState<Element | null>(null);

  useEffect(() => {
    // Check if user has completed the tour before
    const tourCompleted = localStorage.getItem("appTourCompleted");
    if (tourCompleted) {
      setIsVisible(false);
      return;
    }

    // Find the target element for the current step
    const step = tourSteps[currentStep];
    if (step) {
      const element = document.querySelector(step.target);
      setTargetElement(element);
    }
  }, [currentStep, location]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    localStorage.setItem("appTourCompleted", "true");
    setIsVisible(false);
  };

  const getCurrentPageSteps = () => {
    return tourSteps.filter(step => step.page === location);
  };

  if (!isVisible || !targetElement) return null;

  const currentPageSteps = getCurrentPageSteps();
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="p-4 w-80 shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">{tourSteps[currentStep].title}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={completeTour}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {tourSteps[currentStep].description}
          </p>
          <div className="space-y-4">
            <Progress value={progress} className="h-1" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
              <Button size="sm" onClick={handleNext}>
                {currentStep < tourSteps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
