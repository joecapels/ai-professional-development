import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { StudyChat } from "@/components/study-chat";
import { NavBar } from "@/components/nav-bar";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-4xl py-8">
        <StudyChat />
      </main>
    </div>
  );
}