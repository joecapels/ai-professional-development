import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function OneRingPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/power/users"],
    queryFn: async () => {
      const res = await fetch("/api/power/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">The One Ring - Power User Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users?.map((user: any) => (
          <Card key={user.id} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{user.username}</h3>
                <span className={`text-sm ${user.isPowerUser ? 'text-primary' : 'text-muted-foreground'}`}>
                  {user.isPowerUser ? 'Power User' : 'Regular User'}
                </span>
              </div>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>User ID: {user.id}</p>
                <p>Last Active: {new Date(user.lastActive).toLocaleDateString()}</p>
                <p>Session Count: {user.sessionCount}</p>
                <p>IP Address: {user.ipAddress}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
