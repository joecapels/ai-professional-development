import { useQuery } from "@tanstack/react-query";
import { Badge, UserAchievement } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge as UIBadge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function BadgesPage() {
  const { toast } = useToast();
  
  const { data: badges } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });

  const { data: achievements } = useQuery<(UserAchievement & { badge: Badge })[]>({
    queryKey: ["/api/achievements"],
  });

  const getBadgeProgress = (badgeId: number) => {
    const achievement = achievements?.find(a => a.badge.id === badgeId);
    return achievement?.progress || null;
  };

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
                  <UIBadge variant={isEarned ? "default" : "secondary"}>
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
                
                {!isEarned && (
                  <p className="text-sm text-muted-foreground italic">
                    Complete {badge.criteria?.threshold} {badge.criteria?.type} to earn this badge
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
