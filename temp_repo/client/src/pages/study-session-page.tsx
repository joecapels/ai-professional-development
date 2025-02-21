import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Timer, Pause, Play, StopCircle, BookOpen, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function StudySessionPage() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'active' | 'paused' | 'connecting' | 'error'>('connecting');
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      setStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
        setStatus('active');
        toast({
          title: "Connected",
          description: "Study session connection established",
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'error') {
            setStatus('error');
            toast({
              title: "Session Error",
              description: message.message,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          toast({
            title: "Message Error",
            description: "Failed to process server message",
            variant: "destructive",
          });
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setStatus('error');

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);

          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectTimeoutRef.current = setTimeout(connectWebSocket, timeout);

          toast({
            title: "Disconnected",
            description: `Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Connection Failed",
            description: "Please refresh the page to reconnect",
            variant: "destructive",
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('error');
        toast({
          title: "Connection Error",
          description: "Failed to connect to study session",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setStatus('error');
      toast({
        title: "Connection Error",
        description: "Failed to establish study session connection",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    connectWebSocket();

    // Start timer
    timerRef.current = setInterval(() => {
      if (status === 'active') {
        setDuration(prev => prev + 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [status]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      toast({
        title: "Connection Error",
        description: "Cannot send message, connection lost. Attempting to reconnect...",
        variant: "destructive",
      });
      connectWebSocket(); // Attempt to reconnect
    }
  };

  const togglePause = () => {
    if (status === 'error' || status === 'connecting') {
      toast({
        title: "Cannot Pause/Resume",
        description: "Please wait for connection to be established",
        variant: "destructive",
      });
      return;
    }

    const newStatus = status === 'active' ? 'paused' : 'active';
    sendMessage({
      type: newStatus === 'active' ? 'resume' : 'pause',
      sessionId: Number(sessionId)
    });
    setStatus(newStatus);
    toast({
      title: newStatus === 'active' ? "Session Resumed" : "Session Paused",
      description: newStatus === 'active' ? "Keep up the good work!" : "Take a break, you've earned it!",
    });
  };

  const endSession = () => {
    sendMessage({
      type: 'end',
      sessionId: Number(sessionId)
    });
    toast({
      title: "Session Ended",
      description: "Great work! Your progress has been saved.",
    });
    setLocation('/study-tracker');
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Active Study Session</h1>
          <p className="text-muted-foreground">Stay focused and track your progress</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className={`bg-gradient-to-br ${status === 'error' ? 'from-red-500/5 to-red-500/10' : 'from-primary/5 to-primary/10'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Session Timer
                {status === 'connecting' && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <motion.div
                  key={status}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold mb-6"
                >
                  {formatTime(duration)}
                </motion.div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={togglePause}
                    disabled={status === 'error' || status === 'connecting'}
                    className="flex items-center gap-2"
                  >
                    {status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={endSession}
                    disabled={status === 'connecting'}
                    className="flex items-center gap-2"
                  >
                    <StopCircle className="h-4 w-4" />
                    End Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <textarea
                  className="w-full h-32 p-3 rounded-md bg-background border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add your study notes here..."
                />
                <Button className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}