import React from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ChatPage from "@/pages/chat-page";
import QuizPage from "@/pages/quiz-page";
import SettingsPage from "@/pages/settings-page";
import DocumentsPage from "@/pages/documents-page";
import AnalyticsPage from "@/pages/analytics-page";
import FlashcardPage from "@/pages/flashcard-page";
import BadgesPage from "@/pages/badges-page";
import StudyTrackerPage from "@/pages/study-tracker-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/quiz" component={QuizPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/flashcards" component={FlashcardPage} />
      <ProtectedRoute path="/badges" component={BadgesPage} />
      <ProtectedRoute path="/study-tracker" component={StudyTrackerPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}