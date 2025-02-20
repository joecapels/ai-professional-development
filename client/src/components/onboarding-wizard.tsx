import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Book, Brain, Rocket, Check } from "lucide-react";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const characterAnimations = {
  idle: {
    y: [0, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  excited: {
    scale: [1, 1.1, 1],
    rotate: [-5, 5, -5, 5, 0],
    transition: {
      duration: 0.5
    }
  }
};

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    learningStyle: "",
    pacePreference: "",
    interests: [],
    name: ""
  });
  const [characterState, setCharacterState] = useState<"idle" | "excited">("idle");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const steps: WizardStep[] = [
    {
      id: "welcome",
      title: "Welcome to Your Learning Journey!",
      description: "I'm Sparky, your friendly guide to professional development!",
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <Label htmlFor="name">What should I call you?</Label>
          <Input
            id="name"
            value={preferences.name}
            onChange={(e) => setPreferences({ ...preferences, name: e.target.value })}
            placeholder="Your name"
          />
        </div>
      )
    },
    {
      id: "learning-style",
      title: "How Do You Learn Best?",
      description: "Let's personalize your learning experience!",
      icon: <Brain className="w-8 h-8 text-primary" />,
      content: (
        <RadioGroup
          value={preferences.learningStyle}
          onValueChange={(value) => setPreferences({ ...preferences, learningStyle: value })}
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="visual" id="visual" />
              <Label htmlFor="visual">Visual - I learn through diagrams and images</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="reading" id="reading" />
              <Label htmlFor="reading">Reading - I prefer detailed written explanations</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="interactive" id="interactive" />
              <Label htmlFor="interactive">Interactive - I learn by doing and practicing</Label>
            </div>
          </div>
        </RadioGroup>
      )
    },
    {
      id: "pace",
      title: "Set Your Learning Pace",
      description: "Everyone learns differently. What's your preferred pace?",
      icon: <Rocket className="w-8 h-8 text-primary" />,
      content: (
        <RadioGroup
          value={preferences.pacePreference}
          onValueChange={(value) => setPreferences({ ...preferences, pacePreference: value })}
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="steady" id="steady" />
              <Label htmlFor="steady">Steady - I prefer a structured, methodical approach</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="accelerated" id="accelerated" />
              <Label htmlFor="accelerated">Accelerated - I like to move quickly through material</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="flexible" id="flexible" />
              <Label htmlFor="flexible">Flexible - I adjust my pace based on the content</Label>
            </div>
          </div>
        </RadioGroup>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      // Save preferences and complete onboarding
      localStorage.setItem("onboardingComplete", "true");
      localStorage.setItem("userPreferences", JSON.stringify(preferences));
      toast({
        title: "Welcome aboard! 🎉",
        description: `Great to have you here, ${preferences.name}! Your learning journey begins now.`
      });
      setLocation("/dashboard");
    } else {
      setCharacterState("excited");
      setTimeout(() => setCharacterState("idle"), 500);
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <motion.div
            animate={characterState}
            variants={characterAnimations}
            className="mx-auto mb-4"
          >
            {steps[currentStep].icon}
          </motion.div>
          <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={steps[currentStep].id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? (
                <>
                  Complete <Check className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}