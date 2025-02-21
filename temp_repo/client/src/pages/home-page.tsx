import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import StudentPage from "./student-page";
import AdminPage from "./admin-page";

export default function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return user.isAdmin ? <AdminPage /> : <StudentPage />;
}
