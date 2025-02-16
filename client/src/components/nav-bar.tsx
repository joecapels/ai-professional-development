import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const getNavClass = (path: string) => 
    `text-sm transition-colors hover:text-foreground ${
      isActive(path) 
        ? "text-foreground font-medium" 
        : "text-foreground/60"
    }`;

  return (
    <nav className="border-b p-4">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">Study AI</h1>
          {user && !user.isAdmin && (
            <div className="flex gap-4">
              <Link href="/">
                <span className={getNavClass("/")}>Dashboard</span>
              </Link>
              <Link href="/chat">
                <span className={getNavClass("/chat")}>Study Chat</span>
              </Link>
              <Link href="/settings">
                <span className={getNavClass("/settings")}>Settings</span>
              </Link>
            </div>
          )}
          {user && user.isAdmin && (
            <div className="flex gap-4">
              <Link href="/">
                <span className={getNavClass("/")}>Admin Dashboard</span>
              </Link>
            </div>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.username}
            </span>
            <Button 
              variant="outline" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}