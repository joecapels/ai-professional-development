import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

const ADMIN_ONLY_ROUTES = ['/admin'];
const USER_ONLY_ROUTES = ['/', '/chat', '/quiz', '/settings', '/documents', '/analytics', '/flashcards', '/badges', '/notifications', '/study-tracker'];

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Redirect non-admin users trying to access admin routes
  if (ADMIN_ONLY_ROUTES.includes(path) && !user.isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // Redirect admin users trying to access regular user routes
  if (USER_ONLY_ROUTES.includes(path) && user.isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/admin" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}