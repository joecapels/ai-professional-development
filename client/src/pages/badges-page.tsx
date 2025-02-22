import { useQuery } from "@tanstack/react-query";
import { Badge, UserAchievement } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { Badge as BadgeUI } from "@/components/ui/badge";

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
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Learning Achievements</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full" />
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

  const totalAchieved = achievements?.length ?? 0;
  const totalBadges = badges?.length ?? 0;
  const achievementPercentage = totalBadges > 0 ? (totalAchieved / totalBadges) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Learning Achievements</h1>
          <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
            <Progress value={achievementPercentage} className="w-64" />
            <span className="text-sm text-muted-foreground">
              {totalAchieved} of {totalBadges} badges earned
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges?.map((badge) => {
            const progress = getBadgeProgress(badge.id);
            const isEarned = progress?.current >= (progress?.target || 0);

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={isEarned ? "border-primary" : "border-muted"}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <BadgeUI variant={isEarned ? "default" : "outline"}>
                        {badge.rarity}
                      </BadgeUI>
                      {progress && (
                        <span className="text-sm text-muted-foreground">
                          {progress.current}/{progress.target}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{badge.name}</h3>
                    <CardDescription>{badge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {progress && (
                      <Progress 
                        value={(progress.current / progress.target) * 100} 
                        className="h-2"
                      />
                    )}
                  </CardContent>
                </Card>
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