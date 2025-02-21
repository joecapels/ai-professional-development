import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock notifications - should be fetched from an API in a real app
const initialNotifications = [
  {
    id: 1,
    title: "New Achievement Unlocked",
    description: "You've completed 5 study sessions!",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    title: "Quiz Results Available",
    description: "Your recent quiz results are ready to view",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: 3,
    title: "Study Reminder",
    description: "Time for your daily study session",
    time: "1 day ago",
    unread: false,
  },
];

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    toast({
      title: "Notifications marked as read",
      description: "All notifications have been marked as read",
    });
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, unread: false } : n
    ));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount === 0 
                ? "No new notifications" 
                : `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              }
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`transition-colors ${
                notification.unread ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      notification.unread ? 'text-primary' : ''
                    }`}>
                      {notification.title}
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      {notification.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {notification.time}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.unread && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! Check back later for new notifications.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
