import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Save, Volume2, VolumeX } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function StudyChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");

  const {
    voices,
    speaking,
    selectedVoice,
    setSelectedVoice,
    speak,
    cancel
  } = useSpeechSynthesis();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { message });
      return res.json();
    },
    onSuccess: (response: { message: string }) => {
      setMessages(prev => [...prev, { role: "assistant", content: response.message }]);
    },
  });

  const saveDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/documents", {
        title: data.title,
        content: data.content,
        type: "chat",
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Conversation saved successfully" });
      setSaveDialogOpen(false);
      setDocumentTitle("");
    },
    onError: (error) => {
      toast({
        title: "Failed to save conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    chatMutation.mutate(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSave = () => {
    if (!documentTitle) return;
    const content = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");
    saveDocumentMutation.mutate({
      title: documentTitle,
      content,
    });
  };

  const handleSpeak = useCallback((text: string) => {
    if (speaking) {
      cancel();
    } else {
      speak(text);
    }
  }, [speak, cancel, speaking]);

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] mx-auto max-w-3xl shadow-lg">
      <CardHeader className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            AI Study Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={selectedVoice?.name}
              onValueChange={(value) => {
                const voice = voices.find(v => v.name === value);
                setSelectedVoice(voice || null);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.name} value={voice.name}>
                    {`${voice.name} (${voice.lang})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6 p-6">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-6 py-4 shadow-md transition-colors ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-4"
                      : "bg-muted/60 mr-4 prose prose-slate dark:prose-invert"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`${
                      msg.role === "assistant" 
                        ? "prose prose-slate dark:prose-invert max-w-none leading-relaxed"
                        : "text-base leading-relaxed"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="space-y-4">
                          {msg.content.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="text-base">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSpeak(msg.content)}
                        className="flex-shrink-0 hover:bg-background/20"
                        title={speaking ? "Stop speaking" : "Read aloud"}
                      >
                        {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted/60 rounded-lg px-6 py-4 mr-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="sticky bottom-0 bg-background pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask any study-related question..."
                className="flex-1 bg-muted/60 text-base"
              />
              <Button
                onClick={handleSend}
                disabled={chatMutation.isPending || !input.trim()}
                className="bg-primary hover:bg-primary/90 px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(true)}
                className="w-full gap-2 text-base font-medium"
              >
                <Save className="h-4 w-4" />
                Save Conversation
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Save Chat Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Enter a title for this conversation"
                className="bg-muted/60"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saveDocumentMutation.isPending || !documentTitle}
              className="w-full bg-primary hover:bg-primary/90 gap-2 text-base font-medium"
            >
              {saveDocumentMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}