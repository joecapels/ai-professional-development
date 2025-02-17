import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, Search, Bell, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const getNavClass = (path: string) => 
    `text-sm font-medium transition-colors hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-md ${
      isActive(path) 
        ? "text-primary bg-primary/10 font-semibold" 
        : "text-muted-foreground"
    }`;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="container px-4 h-14">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-primary">
              Study AI
            </h1>

            {/* Search bar */}
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="search"
                placeholder="Search..."
                className="h-9 w-64 rounded-full bg-secondary/80 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
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
            <div className="hidden md:flex items-center gap-1">
              {!user.isAdmin ? (
                <>
                  <Link href="/"><span className={getNavClass("/")}>Dashboard</span></Link>
                  <Link href="/chat"><span className={getNavClass("/chat")}>Study Chat</span></Link>
                  <Link href="/quiz"><span className={getNavClass("/quiz")}>Take Quiz</span></Link>
                  <Link href="/flashcards"><span className={getNavClass("/flashcards")}>Flashcards</span></Link>
                  <Link href="/documents"><span className={getNavClass("/documents")}>Documents</span></Link>
                  <Link href="/study-tracker"><span className={getNavClass("/study-tracker")}>Study Tracker</span></Link>
                  <Link href="/badges"><span className={getNavClass("/badges")}>Badges</span></Link>
                  <Link href="/analytics"><span className={getNavClass("/analytics")}>Analytics</span></Link>
                </>
              ) : (
                <Link href="/"><span className={getNavClass("/")}>Admin Dashboard</span></Link>
              )}

              {/* User section */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
                </Button>

                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.username}</span>
                    <span className="text-xs text-muted-foreground">Student</span>
                  </div>
                </div>

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
          <div className="md:hidden py-4 space-y-2">
            {!user.isAdmin ? (
              <>
                <Link href="/"><span className={getNavClass("/")}>Dashboard</span></Link>
                <Link href="/chat"><span className={getNavClass("/chat")}>Study Chat</span></Link>
                <Link href="/quiz"><span className={getNavClass("/quiz")}>Take Quiz</span></Link>
                <Link href="/flashcards"><span className={getNavClass("/flashcards")}>Flashcards</span></Link>
                <Link href="/documents"><span className={getNavClass("/documents")}>Documents</span></Link>
                <Link href="/study-tracker"><span className={getNavClass("/study-tracker")}>Study Tracker</span></Link>
                <Link href="/badges"><span className={getNavClass("/badges")}>Badges</span></Link>
                <Link href="/analytics"><span className={getNavClass("/analytics")}>Analytics</span></Link>
              </>
            ) : (
              <Link href="/"><span className={getNavClass("/")}>Admin Dashboard</span></Link>
            )}

            <div className="pt-4 mt-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.username}</span>
                  <span className="text-xs text-muted-foreground">Student</span>
                </div>
              </div>
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
    </nav>
  );
}