import { useQuery } from "@tanstack/react-query";
import { NavBar } from "@/components/nav-bar";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Shield, Activity, Globe, Clock } from "lucide-react";

interface UserDetailedData {
  id: number;
  username: string;
  subscriptionStatus: 'active' | 'inactive' | 'pending';
  ipAddress: string;
  lastActive: string;
  totalSessions: number;
  averageSessionLength: number;
  lastLoginLocation: string;
  createdAt: string;
  sessions: Array<{
    id: number;
    startTime: string;
    endTime: string | null;
    duration: number;
    status: 'active' | 'completed' | 'paused';
  }>;
}

export default function TheOneRingPage() {
  const { user } = useAuth();
  
  // Redirect if not a power user
  if (!user?.isPowerUser) {
    return <Redirect to="/power-login" />;
  }

  const { data: userDetails, isLoading } = useQuery<UserDetailedData[]>({
    queryKey: ["/api/power/users/detailed"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Failed to load user data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">The One Ring</h1>
            <p className="text-muted-foreground">Master view of all system users and their activities</p>
          </div>
          <Shield className="h-8 w-8 text-primary" />
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Users Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Avg. Session</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userDetails.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell className="font-medium">{userData.username}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            userData.subscriptionStatus === 'active'
                              ? 'bg-green-500/10 text-green-500'
                              : userData.subscriptionStatus === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {userData.subscriptionStatus}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {userData.ipAddress}
                        </TableCell>
                        <TableCell>{userData.lastLoginLocation}</TableCell>
                        <TableCell>
                          {new Date(userData.lastActive).toLocaleString()}
                        </TableCell>
                        <TableCell>{userData.totalSessions}</TableCell>
                        <TableCell>
                          {Math.round(userData.averageSessionLength / 60)} mins
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {userDetails.map((userData) => (
            <Card key={userData.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Session History: {userData.username}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session ID</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userData.sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>#{session.id}</TableCell>
                          <TableCell>
                            {new Date(session.startTime).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {session.endTime
                              ? new Date(session.endTime).toLocaleString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {Math.round(session.duration / 60)} mins
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              session.status === 'active'
                                ? 'bg-green-500/10 text-green-500'
                                : session.status === 'paused'
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              {session.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
