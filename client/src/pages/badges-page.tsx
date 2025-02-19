import { useQuery } from "@tanstack/react-query";
import { Badge, UserAchievement } from "@shared/schema";
import { AnimatedBadge } from "@/components/animated-badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function BadgesPage() {
  const { toast } = useToast();

  const { data: badges, isLoading: loadingBadges, error: badgesError } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });

  const { data: achievements, isLoading: loadingAchievements, error: achievementsError } = useQuery<(UserAchievement & { badge: Badge })[]>({
    queryKey: ["/api/achievements"],
  });

  const getBadgeProgress = (badgeId: number) => {
    const achievement = achievements?.find(a => a.badge.id === badgeId);
    if (!achievement?.progress) return undefined;
    const { current, target } = achievement.progress;
    return { current, target };
  };

  if (loadingBadges || loadingAchievements) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Learning Achievements</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-full" />
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

  const totalAchieved = achievements?.length ?? 0;
  const totalBadges = badges?.length ?? 0;
  const achievementPercentage = totalBadges > 0 ? (totalAchieved / totalBadges) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <motion.div 
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold">Learning Achievements</h1>
          <div className="flex items-center gap-4">
            <Progress value={achievementPercentage} className="w-64" />
            <span className="text-sm text-muted-foreground">
              {totalAchieved} of {totalBadges} badges earned
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges?.map((badge, index) => {
            const progress = getBadgeProgress(badge.id);
            const isEarned = !!progress;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative group"
              >
                <AnimatedBadge
                  name={badge.name}
                  description={badge.description}
                  imageUrl={badge.imageUrl}
                  rarity={badge.rarity}
                  progress={progress}
                  earned={isEarned}
                />
                {!isEarned && (
                  <motion.div 
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  >
                    <p className="text-sm text-center px-4">
                      Complete the required challenges to earn this badge!
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {badges?.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No badges available yet. Start learning to earn some!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}