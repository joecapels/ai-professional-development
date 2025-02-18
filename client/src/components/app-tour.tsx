import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  page: string;
  roleSpecific?: 'student' | 'admin' | 'all';
  animation?: 'fade' | 'slide' | 'bounce' | 'zoom';
}

const tourSteps: TourStep[] = [
  {
    target: "[data-tour='dashboard']",
    title: "Welcome to Your Dashboard",
    description: "This is your central hub for tracking progress and accessing all features.",
    position: "bottom",
    page: "/",
    animation: "zoom",
    roleSpecific: "all"
  },
  {
    target: "[data-tour='learn']",
    title: "Interactive Learning",
    description: "Engage in AI-powered conversations to enhance your understanding.",
    position: "bottom",
    page: "/chat",
    animation: "slide",
    roleSpecific: "student"
  },
  {
    target: "[data-tour='practice']",
    title: "Practice Your Knowledge",
    description: "Test your understanding with interactive quizzes and exercises.",
    position: "bottom",
    page: "/quiz",
    animation: "bounce",
    roleSpecific: "student"
  },
  {
    target: "[data-tour='flashcards']",
    title: "Flashcard Review",
    description: "Review key concepts with our spaced repetition system.",
    position: "bottom",
    page: "/flashcards",
    animation: "fade",
    roleSpecific: "student"
  },
  {
    target: "[data-tour='achievements']",
    title: "Track Your Achievements",
    description: "View your earned badges and progress milestones.",
    position: "bottom",
    page: "/badges",
    animation: "slide",
    roleSpecific: "student"
  }
];

const getAnimationVariant = (animation: string) => {
  const baseTransition = { duration: 0.5, ease: "easeOut" };

  switch (animation) {
    case "fade":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: baseTransition
      };
    case "slide":
      return {
        initial: { x: 50, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0 },
        transition: { ...baseTransition, type: "spring", stiffness: 100 }
      };
    case "bounce":
      return {
        initial: { scale: 0.3, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.3, opacity: 0 },
        transition: { ...baseTransition, type: "spring", bounce: 0.5 }
      };
    case "zoom":
      return {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 1.2, opacity: 0 },
        transition: baseTransition
      };
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: baseTransition
      };
  }
};

export function AppTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [location] = useLocation();
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const { user } = useAuth();

  const filteredSteps = tourSteps.filter(step => 
    step.roleSpecific === "all" || step.roleSpecific === (user?.isAdmin ? "admin" : "student")
  );

  useEffect(() => {
    const tourCompleted = localStorage.getItem("appTourCompleted");
    if (tourCompleted) {
      setIsVisible(false);
      return;
    }

    const step = filteredSteps[currentStep];
    if (step) {
      const element = document.querySelector(step.target);
      setTargetElement(element);
    }
  }, [currentStep, location, filteredSteps]);

  const handleNext = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    localStorage.setItem("appTourCompleted", "true");
    setIsVisible(false);
  };

  if (!isVisible || !targetElement) return null;

  const progress = ((currentStep + 1) / filteredSteps.length) * 100;
  const currentAnimation = filteredSteps[currentStep].animation || "fade";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        {...getAnimationVariant(currentAnimation)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="p-4 w-80 shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">{filteredSteps[currentStep].title}</h3>
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
            {filteredSteps[currentStep].description}
          </p>
          <div className="space-y-4">
            <Progress value={progress} className="h-1" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {filteredSteps.length}
              </span>
              <Button size="sm" onClick={handleNext}>
                {currentStep < filteredSteps.length - 1 ? (
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