import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, Search, Bell, User as UserIcon, Settings } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface MenuItem {
  path: string;
  label: string;
  dataTour?: string;
}

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

  const menuItems: MenuItem[] = !user?.isAdmin ? [
    { path: "/", label: "Dashboard", dataTour: "dashboard" },
    { path: "/chat", label: "Learn", dataTour: "learn" },
    { path: "/quiz", label: "Practice", dataTour: "practice" },
    { path: "/flashcards", label: "Flashcards", dataTour: "flashcards" },
    { path: "/documents", label: "Documents", dataTour: "documents" },
    { path: "/badges", label: "Achievements", dataTour: "achievements" },
    { path: "/analytics", label: "Analytics", dataTour: "analytics" },
    { path: "/settings", label: "Settings", dataTour: "settings" }
  ] : [
    { path: "/admin", label: "Admin Dashboard" }
  ];

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

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-1">
            {user && (
              <>
                {menuItems.map(({ path, label, dataTour }) => (
                  <Link key={path} href={path}>
                    <span 
                      className={getNavClass(path)}
                      data-tour={dataTour}
                    >
                      {label}
                    </span>
                  </Link>
                ))}

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
                      <span className="text-xs text-muted-foreground">
                        {user.isAdmin ? "Administrator" : "Student"}
                      </span>
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
              </>
            )}
          </div>

          {/* Mobile menu button and drawer */}
          <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Toggle Menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[90vh]">
              <DrawerHeader>
                <DrawerTitle>Menu</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 py-2 flex flex-col gap-2">
                <div className="flex items-center gap-4 pb-4 mb-4 border-b">
                  {user && (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.username}</span>
                        <span className="text-sm text-muted-foreground">
                          {user.isAdmin ? "Administrator" : "Student"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {user && menuItems.map(({ path, label, dataTour }) => (
                  <Link key={path} href={path}>
                    <a
                      className={`${getNavClass(path)} block w-full text-left py-3`}
                      data-tour={dataTour}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {label}
                    </a>
                  </Link>
                ))}

                <div className="mt-auto pt-4 border-t">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsMenuOpen(false);
                    }}
                    disabled={logoutMutation.isPending}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </nav>
  );
}