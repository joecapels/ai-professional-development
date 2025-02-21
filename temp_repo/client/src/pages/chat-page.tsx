import { useAuth } from "@/hooks/use-auth";
import { StudyChat } from "@/components/study-chat";
import { NavBar } from "@/components/nav-bar";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8 max-w-4xl">
        <StudyChat />
      </main>
    </div>
  );
}