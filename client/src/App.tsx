import React from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { LoadingProvider } from "@/hooks/use-loading";
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
import PowerLoginPage from "@/pages/power-login";
import PowerDashboardPage from "@/pages/power-dashboard"; 
import OneRingPage from "@/pages/one-ring";
import TheOneRingPage from "@/pages/the-one-ring";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoadingProvider>
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <Route path="/power-login" component={PowerLoginPage} />
            <ProtectedRoute path="/" component={HomePage} />
            <ProtectedRoute path="/chat" component={ChatPage} />
            <ProtectedRoute path="/quiz" component={QuizPage} />
            <ProtectedRoute path="/settings" component={SettingsPage} />
            <ProtectedRoute path="/documents" component={DocumentsPage} />
            <ProtectedRoute path="/analytics" component={AnalyticsPage} />
            <ProtectedRoute path="/flashcards" component={FlashcardPage} />
            <ProtectedRoute path="/badges" component={BadgesPage} />
            <ProtectedRoute path="/power-dashboard" component={PowerDashboardPage} />
            <ProtectedRoute path="/one-ring" component={OneRingPage} />
            <ProtectedRoute path="/the-one-ring" component={TheOneRingPage} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </LoadingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/quiz" component={QuizPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/flashcards" component={FlashcardPage} />
      <ProtectedRoute path="/badges" component={BadgesPage} />
      <ProtectedRoute path="/power-dashboard" component={PowerDashboardPage} />
      <ProtectedRoute path="/one-ring" component={OneRingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/power-login" component={PowerLoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </LoadingProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}