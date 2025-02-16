import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Save, Volume2, VolumeX, Code, ImageIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  role: "user" | "assistant";
  content: string | {
    text: string;
    media?: {
      type: "image" | "graph" | "code";
      content: string;
      language?: string;
    }[];
  };
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
    onSuccess: (response: { message: string; media?: { type: string; content: string; language?: string }[] }) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: {
          text: response.message,
          media: response.media
        }
      }]);
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
      .map((msg) => `${msg.role}: ${typeof msg.content === 'string' ? msg.content : msg.content.text}`)
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

  const renderMessage = (msg: Message, index: number) => {
    const isAssistant = msg.role === "assistant";
    const content = typeof msg.content === 'string' ? { text: msg.content } : msg.content;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        key={index}
        className={`flex ${isAssistant ? "justify-start" : "justify-end"} mb-4`}
      >
        <div
          className={`max-w-[85%] rounded-lg px-4 py-3 shadow-md ${
            isAssistant
              ? "bg-card border border-border mr-4"
              : "bg-primary text-primary-foreground ml-4"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className={`leading-relaxed ${isAssistant ? "text-foreground" : "text-primary-foreground"} font-sans text-sm md:text-base`}>
                {content.text}
              </p>
              {isAssistant && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSpeak(content.text)}
                  className="flex-shrink-0 hover:bg-background/10"
                  title={speaking ? "Stop speaking" : "Read aloud"}
                >
                  {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              )}
            </div>

            {content.media && (
              <div className="space-y-3 mt-3">
                {content.media.map((item, mediaIndex) => (
                  <div key={mediaIndex} className="rounded-md overflow-hidden">
                    {item.type === 'code' && (
                      <div className="relative">
                        <div className="absolute right-2 top-2 z-10">
                          <Code className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <SyntaxHighlighter
                          language={item.language || 'javascript'}
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                        >
                          {item.content}
                        </SyntaxHighlighter>
                      </div>
                    )}
                    {(item.type === 'image' || item.type === 'graph') && (
                      <div className="relative bg-muted rounded-md p-2">
                        <div className="absolute right-2 top-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <img
                          src={item.content}
                          alt="Content visualization"
                          className="w-full h-auto rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] mx-auto max-w-4xl shadow-lg border-border/40">
      <CardHeader className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
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

      <CardContent className="flex-1 flex flex-col gap-4 p-6">
        <ScrollArea className="flex-1 pr-4">
          <AnimatePresence>
            {messages.map((msg, i) => renderMessage(msg, i))}
          </AnimatePresence>
          {chatMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-card rounded-lg px-4 py-3 mr-4 shadow-md">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </motion.div>
          )}
        </ScrollArea>

        <div className="sticky bottom-0 bg-background pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask any study-related question..."
                className="flex-1 bg-muted border-border/40"
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
                className="w-full border-border/40"
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