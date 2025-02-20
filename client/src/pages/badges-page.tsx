import { useQuery } from "@tanstack/react-query";
import { Badge, UserAchievement } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Award, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const rarityColors = {
  common: "bg-slate-100 border-slate-200",
  uncommon: "bg-green-50 border-green-100",
  rare: "bg-blue-50 border-blue-100",
  epic: "bg-purple-50 border-purple-100",
  legendary: "bg-amber-50 border-amber-100"
};

const rarityTextColors = {
  common: "text-slate-600",
  uncommon: "text-green-600",
  rare: "text-blue-600",
  epic: "text-purple-600",
  legendary: "text-amber-600"
};

export default function BadgesPage() {
  const { data: badges, isLoading: loadingBadges, error: badgesError } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });

  const { data: achievements, isLoading: loadingAchievements, error: achievementsError } = useQuery<UserAchievement[]>({
    queryKey: ["/api/achievements"],
  });

  if (loadingBadges || loadingAchievements) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Achievement Badges</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-6 bg-card rounded-lg border">
                <div className="space-y-4">
                  <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (badgesError || achievementsError) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load badges. Please try again later.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const totalEarned = achievements?.length ?? 0;
  const totalBadges = badges?.length ?? 0;
  const progressPercentage = totalBadges > 0 ? (totalEarned / totalBadges) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Achievement Badges</h1>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <Progress value={progressPercentage} className="w-64" />
            <span className="text-sm text-muted-foreground">
              {totalEarned} of {totalBadges} earned
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges?.map((badge, index) => {
            const achievement = achievements?.find(a => a.badgeId === badge.id);
            const isEarned = !!achievement;
            const progress = achievement?.progress;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group relative"
              >
                <div className={cn(
                  "p-6 rounded-lg border transition-all duration-200",
                  "hover:shadow-lg hover:-translate-y-1",
                  isEarned ? rarityColors[badge.rarity] : "bg-card/50 border-muted"
                )}>
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Badge Icon */}
                    <div className="relative">
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center",
                        "transition-colors duration-200",
                        isEarned ? rarityTextColors[badge.rarity] : "text-muted-foreground"
                      )}>
                        <div dangerouslySetInnerHTML={{ __html: badge.imageUrl }} 
                             className="w-12 h-12" />
                      </div>
                      {!isEarned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Badge Info */}
                    <div>
                      <h3 className={cn(
                        "text-lg font-semibold mb-1",
                        isEarned ? rarityTextColors[badge.rarity] : "text-muted-foreground"
                      )}>
                        {badge.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {badge.description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    {progress && (
                      <div className="w-full">
                        <Progress 
                          value={(progress.current / progress.target) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress.current} / {progress.target}
                        </p>
                      </div>
                    )}

                    {/* Rarity Tag */}
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full capitalize",
                      rarityColors[badge.rarity],
                      rarityTextColors[badge.rarity]
                    )}>
                      {badge.rarity}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}