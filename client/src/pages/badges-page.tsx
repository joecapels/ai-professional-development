import { useQuery } from "@tanstack/react-query";
import { Badge, UserAchievement } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge as UIBadge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    return achievement?.progress || null;
  };

  if (loadingBadges || loadingAchievements) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Learning Achievements</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </Card>
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

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Learning Achievements</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges?.map((badge) => {
            const progress = getBadgeProgress(badge.id);
            const isEarned = !!progress;

            return (
              <Card key={badge.id} className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{badge.name}</h3>
                    <p className="text-muted-foreground">{badge.description}</p>
                  </div>
                  <UIBadge 
                    variant={isEarned ? "default" : "secondary"}
                    className={isEarned ? "bg-primary" : ""}
                  >
                    {badge.rarity}
                  </UIBadge>
                </div>

                {progress && (
                  <div className="space-y-2">
                    <Progress 
                      value={(progress.current / progress.target) * 100}
                      className="h-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      Progress: {progress.current}/{progress.target}
                    </p>
                  </div>
                )}

                {!isEarned && badge.criteria && (
                  <p className="text-sm text-muted-foreground italic">
                    Complete {badge.criteria.threshold} {badge.criteria.type} to earn this badge
                  </p>
                )}
              </Card>
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