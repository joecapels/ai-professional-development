import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { StudyChat } from "@/components/study-chat";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b p-4">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">Study AI Chat</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container max-w-4xl py-8">
        <StudyChat />
      </main>
    </div>
  );
}
