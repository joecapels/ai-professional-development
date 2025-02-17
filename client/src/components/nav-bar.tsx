import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const getNavClass = (path: string) => 
    `text-sm font-medium transition-colors hover:text-primary ${
      isActive(path) 
        ? "text-primary font-semibold" 
        : "text-muted-foreground"
    }`;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary">
              Study AI
            </h1>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              {!user.isAdmin ? (
                <>
                  <Link href="/"><span className={getNavClass("/")}>Dashboard</span></Link>
                  <Link href="/chat"><span className={getNavClass("/chat")}>Study Chat</span></Link>
                  <Link href="/quiz"><span className={getNavClass("/quiz")}>Take Quiz</span></Link>
                  <Link href="/flashcards"><span className={getNavClass("/flashcards")}>Flashcards</span></Link>
                  <Link href="/documents"><span className={getNavClass("/documents")}>Documents</span></Link>
                  <Link href="/badges"><span className={getNavClass("/badges")}>Badges</span></Link>
                  <Link href="/analytics"><span className={getNavClass("/analytics")}>Analytics</span></Link>
                  <Link href="/study-tracker"><span className={getNavClass("/study-tracker")}>Study Tracker</span></Link>
                  <Link href="/settings"><span className={getNavClass("/settings")}>Settings</span></Link>
                </>
              ) : (
                <Link href="/"><span className={getNavClass("/")}>Admin Dashboard</span></Link>
              )}
              <div className="flex items-center gap-4 ml-4 border-l pl-4">
                <span className="text-sm text-muted-foreground">
                  {user.username}
                </span>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && user && (
          <div className="md:hidden pt-4 pb-2">
            <div className="flex flex-col gap-4">
              {!user.isAdmin ? (
                <>
                  <Link href="/"><span className={getNavClass("/")}>Dashboard</span></Link>
                  <Link href="/chat"><span className={getNavClass("/chat")}>Study Chat</span></Link>
                  <Link href="/quiz"><span className={getNavClass("/quiz")}>Take Quiz</span></Link>
                  <Link href="/flashcards"><span className={getNavClass("/flashcards")}>Flashcards</span></Link>
                  <Link href="/documents"><span className={getNavClass("/documents")}>Documents</span></Link>
                  <Link href="/badges"><span className={getNavClass("/badges")}>Badges</span></Link>
                  <Link href="/analytics"><span className={getNavClass("/analytics")}>Analytics</span></Link>
                  <Link href="/study-tracker"><span className={getNavClass("/study-tracker")}>Study Tracker</span></Link>
                  <Link href="/settings"><span className={getNavClass("/settings")}>Settings</span></Link>
                </>
              ) : (
                <Link href="/"><span className={getNavClass("/")}>Admin Dashboard</span></Link>
              )}
              <div className="pt-4 mt-4 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {user.username}
                </span>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}