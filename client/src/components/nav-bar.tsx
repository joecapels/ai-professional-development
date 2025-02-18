import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, Search, Bell, User as UserIcon, Settings, Shield } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

const STAGGER_DELAY = 0.05; // Consistent delay between items

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

  const menuItems = !user?.isAdmin ? [
    { path: "/", label: "Dashboard" },
    { path: "/chat", label: "Study Chat" },
    { path: "/quiz", label: "Take Quiz" },
    { path: "/flashcards", label: "Flashcards" },
    { path: "/documents", label: "Documents" },
    { path: "/badges", label: "Badges" },
    { path: "/analytics", label: "Analytics" },
    { path: "/settings", label: "Settings" }
  ] : [
    { path: "/admin", label: "Admin Dashboard" }
  ];

  const containerVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      transition: { staggerChildren: 0, when: "afterChildren" }
    },
    visible: {
      opacity: 1,
      height: "auto",
      transition: { 
        staggerChildren: STAGGER_DELAY,
        when: "beforeChildren",
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

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
          <div className="hidden md:flex items-center gap-1">
            {/* Super User Login link - always visible */}
            <Link href="/super-login">
              <span className={getNavClass("/super-login")}>
                <Shield className="inline-block h-4 w-4 mr-1" />
                Super User
              </span>
            </Link>

            {user && (
              <>
                {menuItems.map(({ path, label }) => (
                  <Link key={path} href={path}>
                    <span className={getNavClass(path)}>{label}</span>
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
        </div>

        {/* Mobile navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-1">
                {/* Super User Login link - always visible in mobile */}
                <motion.div variants={itemVariants}>
                  <Link href="/super-login">
                    <span className={getNavClass("/super-login")}>
                      <Shield className="inline-block h-4 w-4 mr-1" />
                      Super User
                    </span>
                  </Link>
                </motion.div>

                {user && (
                  <>
                    {menuItems.map(({ path, label }, index) => (
                      <motion.div
                        key={path}
                        variants={itemVariants}
                      >
                        <Link href={path}>
                          <span className={getNavClass(path)}>{label}</span>
                        </Link>
                      </motion.div>
                    ))}

                    <motion.div
                      variants={itemVariants}
                      className="pt-4 mt-4 border-t flex items-center justify-between"
                    >
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
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}