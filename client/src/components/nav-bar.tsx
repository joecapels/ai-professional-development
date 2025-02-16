import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, LayoutDashboard, MessageSquare, ScrollText, BarChart2, Settings, Users } from "lucide-react";
import { useState } from "react";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const getNavClass = (path: string) => 
    `flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
      isActive(path) 
        ? "text-primary font-semibold" 
        : "text-muted-foreground"
    }`;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const renderAdminNav = () => (
    <>
      <Link href="/">
        <span className={getNavClass("/")}>
          <Users size={18} />
          Admin Dashboard
        </span>
      </Link>
      <Link href="/materials">
        <span className={getNavClass("/materials")}>
          <ScrollText size={18} />
          Study Materials
        </span>
      </Link>
      <Link href="/analytics">
        <span className={getNavClass("/analytics")}>
          <BarChart2 size={18} />
          Analytics
        </span>
      </Link>
    </>
  );

  const renderStudentNav = () => (
    <>
      <Link href="/">
        <span className={getNavClass("/")}>
          <LayoutDashboard size={18} />
          Dashboard
        </span>
      </Link>
      <Link href="/chat">
        <span className={getNavClass("/chat")}>
          <MessageSquare size={18} />
          Study Chat
        </span>
      </Link>
      <Link href="/quiz">
        <span className={getNavClass("/quiz")}>
          <ScrollText size={18} />
          Take Quiz
        </span>
      </Link>
      <Link href="/documents">
        <span className={getNavClass("/documents")}>
          <ScrollText size={18} />
          Documents
        </span>
      </Link>
      <Link href="/analytics">
        <span className={getNavClass("/analytics")}>
          <BarChart2 size={18} />
          Analytics
        </span>
      </Link>
      <Link href="/settings">
        <span className={getNavClass("/settings")}>
          <Settings size={18} />
          Settings
        </span>
      </Link>
    </>
  );

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
              {user.isAdmin ? renderAdminNav() : renderStudentNav()}
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
              {user.isAdmin ? renderAdminNav() : renderStudentNav()}
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