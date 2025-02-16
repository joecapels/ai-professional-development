import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b p-4">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">Study AI</h1>
          {user && !user.isAdmin && (
            <div className="flex gap-4">
              <Link href="/">
                <a className="text-foreground/60 hover:text-foreground transition-colors">
                  Dashboard
                </a>
              </Link>
              <Link href="/chat">
                <a className="text-foreground/60 hover:text-foreground transition-colors">
                  Study Chat
                </a>
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Welcome, {user?.username}</span>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
