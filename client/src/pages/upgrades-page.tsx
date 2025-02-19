import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Free Tier",
    price: "$0",
    features: [
      "Basic career insights",
      "Limited chat interactions",
      "Access to public learning resources",
      "Basic progress tracking",
      "Standard support"
    ],
    highlighted: false
  },
  {
    name: "Premium",
    price: "$9.99/month",
    features: [
      "Advanced AI career guidance",
      "Unlimited chat interactions",
      "Premium learning resources",
      "Advanced analytics & tracking",
      "Priority support",
      "Personalized learning paths",
      "Multi-modal learning support",
      "Advanced skill assessments",
      "1-on-1 mentoring sessions"
    ],
    highlighted: true
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function UpgradesPage() {
  const { toast } = useToast();

  const handleUpgradeClick = () => {
    toast({
      title: "Special Offer!",
      description: "No need to upgrade now, have 14 days on us!",
      duration: 5000,
    });
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Growth Path</h1>
        <p className="text-xl text-muted-foreground">
          Unlock your full potential with our premium features
        </p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
      >
        {plans.map((plan) => (
          <motion.div key={plan.name} variants={item}>
            <Card className={`h-full ${plan.highlighted ? 'border-primary shadow-lg' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  {plan.highlighted && (
                    <Badge variant="default" className="ml-2">
                      Most Popular
                    </Badge>
                  )}
                </div>
                <div className="text-3xl font-bold">{plan.price}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={plan.highlighted ? handleUpgradeClick : undefined}
                >
                  {plan.highlighted ? "Upgrade Now" : "Get Started"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Why Choose Premium?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get personalized career guidance, unlimited access to our AI-powered platform, 
          and exclusive learning resources to accelerate your professional growth.
        </p>
      </div>
    </div>
  );
}