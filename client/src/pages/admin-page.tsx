import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, Users, BookOpen, Trophy, Activity,
  MessageSquare, Brain, Clock, FileText,
  BarChart2, Search, Filter, Star, Calendar,
  Shield, ShieldOff, UserPlus, UserMinus,
  MoreHorizontal
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { StudyMaterial, User } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// Previous interfaces remain unchanged

interface Achievement {
  id: number;
  userId: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

interface AdminAnalytics {
  activeSessions: number;
  totalAchievements: number;
  totalUsers: number;
  userStats: Record<number, UserStats>;
  aggregateStats: {
    chatCount: number;
    quizCount: number;
    studySessionCount: number;
    averageSessionDuration: number;
    totalDocuments: number;
    totalFlashcards: number;
  };
  recentAchievements: Achievement[];
}

interface UserStats {
  chatCount: number;
  quizCount: number;
  studySessionCount: number;
  averageSessionDuration: number;
  totalDocuments: number;
  totalFlashcards: number;
  achievements: number;
}


export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "student">("all");
  const [activityFilter, setActivityFilter] = useState<"all" | "active" | "inactive">("all");
  const [timelineFilter, setTimelineFilter] = useState<"all" | "academic" | "engagement" | "milestone">("all");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: materials, isLoading: materialsLoading } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/materials"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AdminAnalytics>({
    queryKey: ["/api/admin/analytics"],
  });

  const form = useForm<StudyMaterial>({
    defaultValues: {
      title: "",
      content: "",
      subject: "",
      difficulty: 1,
    },
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (data: Partial<StudyMaterial>) => {
      const res = await apiRequest("POST", "/api/materials", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Study material created successfully" });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create study material",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const bulkUpdateUsersMutation = useMutation({
    mutationFn: async ({ userIds, updates }: { userIds: number[], updates: Partial<User> }) => {
      const res = await apiRequest("PATCH", "/api/users/bulk", { userIds, updates });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Users updated successfully",
        description: `Updated ${selectedUsers.length} users`
      });
      setSelectedUsers([]);
    },
    onError: (error) => {
      toast({
        title: "Failed to update users",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleBulkAction = (action: 'promote' | 'demote' | 'activate' | 'deactivate') => {
    const updates: Partial<User> = {};

    switch (action) {
      case 'promote':
        updates.isAdmin = true;
        break;
      case 'demote':
        updates.isAdmin = false;
        break;
      case 'activate':
        updates.isActive = true;
        break;
      case 'deactivate':
        updates.isActive = false;
        break;
    }

    bulkUpdateUsersMutation.mutate({ userIds: selectedUsers, updates });
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" ? true :
        (roleFilter === "admin" ? user.isAdmin : !user.isAdmin);
      const isActive = (analytics?.userStats[user.id]?.studySessionCount || 0) > 0;
      const matchesActivity = activityFilter === "all" ? true :
        (activityFilter === "active" ? isActive : !isActive);

      return matchesSearch && matchesRole && matchesActivity;
    });
  }, [users, searchQuery, roleFilter, activityFilter, analytics]);


  if (usersLoading || materialsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Materials</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{materials?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeSessions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Achievements</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalAchievements || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Sessions</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">
                  {analytics?.aggregateStats.studySessionCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg. Duration: {formatDuration(analytics?.aggregateStats.averageSessionDuration || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Content</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Documents:</span>
                  <span className="font-bold">{analytics?.aggregateStats.totalDocuments || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Flashcards:</span>
                  <span className="font-bold">{analytics?.aggregateStats.totalFlashcards || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assessment Stats</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quizzes Taken:</span>
                  <span className="font-bold">{analytics?.aggregateStats.quizCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Chat Interactions:</span>
                  <span className="font-bold">{analytics?.aggregateStats.chatCount || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  {selectedUsers.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <MoreHorizontal className="h-4 w-4" />
                          Bulk Actions ({selectedUsers.length})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleBulkAction('promote')}
                          className="flex items-center gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          Promote to Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleBulkAction('demote')}
                          className="flex items-center gap-2"
                        >
                          <ShieldOff className="h-4 w-4" />
                          Remove Admin Rights
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleBulkAction('activate')}
                          className="flex items-center gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          Activate Users
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleBulkAction('deactivate')}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <UserMinus className="h-4 w-4" />
                          Deactivate Users
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Role: {roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setRoleFilter("all")}>
                          All Roles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRoleFilter("admin")}>
                          Admins Only
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRoleFilter("student")}>
                          Students Only
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Activity: {activityFilter.charAt(0).toUpperCase() + activityFilter.slice(1)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setActivityFilter("all")}>
                          All Users
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActivityFilter("active")}>
                          Active Users
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActivityFilter("inactive")}>
                          Inactive Users
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all users"
                          />
                        </TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead>Study Sessions</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Flashcards</TableHead>
                        <TableHead>Quizzes</TableHead>
                        <TableHead>Achievements</TableHead>
                        <TableHead>Avg. Session</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                              aria-label={`Select user ${user.username}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
                            }`}>
                              {user.isAdmin ? 'Admin' : 'Student'}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{analytics?.userStats[user.id]?.studySessionCount || 0}</TableCell>
                          <TableCell>{analytics?.userStats[user.id]?.totalDocuments || 0}</TableCell>
                          <TableCell>{analytics?.userStats[user.id]?.totalFlashcards || 0}</TableCell>
                          <TableCell>{analytics?.userStats[user.id]?.quizCount || 0}</TableCell>
                          <TableCell>{analytics?.userStats[user.id]?.achievements || 0}</TableCell>
                          <TableCell>
                            {formatDuration(analytics?.userStats[user.id]?.averageSessionDuration || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(!filteredUsers || filteredUsers.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      {users?.length ? 'No users match the current filters.' : 'No users found.'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Study Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit((data) => createMaterialMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input {...form.register("title")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input {...form.register("subject")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Content</label>
                    <Textarea {...form.register("content")} rows={6} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty (1-5)</label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      {...form.register("difficulty", { valueAsNumber: true })}
                    />
                  </div>
                  <Button type="submit" disabled={createMaterialMutation.isPending}>
                    {createMaterialMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Material
                  </Button>
                </form>

                <div className="mt-6 space-y-4">
                  {materials?.map((material) => (
                    <div
                      key={material.id}
                      className="p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <h3 className="font-bold">{material.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Subject: {material.subject} • Difficulty: {material.difficulty}
                      </p>
                    </div>
                  ))}
                  {(!materials || materials.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      No study materials available.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New Activity Timeline Section */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  User Activity Timeline
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      {timelineFilter.charAt(0).toUpperCase() + timelineFilter.slice(1)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimelineFilter("all")}>
                      All Activities
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimelineFilter("academic")}>
                      Academic Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimelineFilter("engagement")}>
                      Platform Engagement
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimelineFilter("milestone")}>
                      Milestones
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <AnimatePresence>
                  {analytics?.recentAchievements
                    ?.filter(achievement =>
                      timelineFilter === "all" || achievement.type === timelineFilter
                    )
                    .map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="relative pl-8 pb-8 last:pb-0"
                      >
                        {/* Timeline connector */}
                        <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-border" />

                        {/* Timeline node */}
                        <div className={`absolute left-0 p-1 rounded-full ${
                          achievement.type === 'milestone' ? 'bg-primary' :
                            achievement.type === 'academic' ? 'bg-green-500' : 'bg-blue-500'
                        }`}>
                          <Star className="h-4 w-4 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-lg p-4 border shadow-sm">
                          <div>
                            <h4 className="font-semibold text-sm">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                          </div>
                          <time className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(achievement.timestamp), 'MMM d, yyyy h:mm a')}
                          </time>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>

                {(!analytics?.recentAchievements || analytics.recentAchievements.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2">No recent achievements to display</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}