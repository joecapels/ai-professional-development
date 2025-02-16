import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] mx-auto max-w-3xl shadow-lg">
      <CardHeader className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <CardTitle className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AI Study Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-4"
                      : "bg-muted mr-4"
                  }`}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2 mr-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="sticky bottom-0 bg-background pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask any study-related question..."
                className="flex-1 bg-muted"
              />
              <Button
                onClick={handleSend}
                disabled={chatMutation.isPending || !input.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(true)}
                className="w-full border-primary/20 hover:bg-primary/10 hover:text-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Conversation
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Chat Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Enter a title for this conversation"
                className="bg-muted"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saveDocumentMutation.isPending || !documentTitle}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {saveDocumentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}