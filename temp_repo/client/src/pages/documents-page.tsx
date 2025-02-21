import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NavBar } from "@/components/nav-bar";
import { Loader2, Search, FileText, MessageSquare, Brain, Filter, HelpCircle } from "lucide-react";
import type { SavedDocument } from "@shared/schema";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type SortOption = "newest" | "oldest" | "title";

interface DocumentTypeConfig {
  color: string;
  darkColor: string;
  gradient: string;
  darkGradient: string;
  icon: JSX.Element;
  label: string;
}

const documentTypes: Record<string, DocumentTypeConfig> = {
  chat: {
    color: "bg-blue-500",
    darkColor: "dark:bg-blue-600",
    gradient: "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
    darkGradient: "dark:from-blue-500/30 dark:to-blue-600/20",
    icon: <MessageSquare className="h-5 w-5" />,
    label: "Chat Conversations"
  },
  quiz: {
    color: "bg-green-500",
    darkColor: "dark:bg-green-600",
    gradient: "bg-gradient-to-br from-green-500/20 to-green-600/10",
    darkGradient: "dark:from-green-500/30 dark:to-green-600/20",
    icon: <Brain className="h-5 w-5" />,
    label: "Quiz Results"
  },
  notes: {
    color: "bg-orange-500",
    darkColor: "dark:bg-orange-600",
    gradient: "bg-gradient-to-br from-orange-500/20 to-orange-600/10",
    darkGradient: "dark:from-orange-500/30 dark:to-orange-600/20",
    icon: <FileText className="h-5 w-5" />,
    label: "Study Notes"
  }
};

const getDocumentPreviewBackground = (type: string) => {
  const config = documentTypes[type] || documentTypes.notes;
  return `${config.gradient} ${config.darkGradient}`;
};

const getDocumentStripColor = (type: string) => {
  const config = documentTypes[type] || documentTypes.notes;
  return `${config.color} ${config.darkColor}`;
};

const getDocumentIcon = (type: string) => {
  return (documentTypes[type] || documentTypes.notes).icon;
};

export default function DocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedDocument, setSelectedDocument] = useState<SavedDocument | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [newDocumentId, setNewDocumentId] = useState<number | null>(null);

  const { data: documents, isLoading } = useQuery<SavedDocument[]>({
    queryKey: ["/api/documents"],
  });

  const saveDocumentMutation = useMutation({
    mutationFn: async (document: Partial<SavedDocument>) => {
      const response = await apiRequest("POST", "/api/documents", document);
      return response.json();
    },
    onMutate: async (newDocument) => {
      await queryClient.cancelQueries({ queryKey: ["/api/documents"] });
      const previousDocuments = queryClient.getQueryData<SavedDocument[]>(["/api/documents"]);

      const now = new Date();
      queryClient.setQueryData<SavedDocument[]>(["/api/documents"], (old = []) => {
        const optimisticDoc = {
          id: Date.now(),
          title: newDocument.title || "Untitled Document",
          content: newDocument.content || "",
          type: newDocument.type || "notes",
          userId: -1,
          metadata: newDocument.metadata || { timestamp: now.toISOString() },
          createdAt: now,
          updatedAt: now,
        } satisfies SavedDocument;
        return [...old, optimisticDoc];
      });

      setNewDocumentId(Date.now());
      setTimeout(() => setNewDocumentId(null), 2000);

      return { previousDocuments };
    },
    onError: (_error, _newDocument, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(["/api/documents"], context.previousDocuments);
      }
      toast({
        title: "Failed to save document",
        description: "Please try again",
        variant: "destructive",
      });
    },
    onSuccess: (savedDoc) => {
      queryClient.setQueryData<SavedDocument[]>(["/api/documents"], (old = []) => {
        const filtered = old?.filter(doc => doc.id !== savedDoc.id) ?? [];
        return [...filtered, savedDoc];
      });
      toast({ title: "Document saved successfully" });
    },
  });

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || doc.type === selectedType;
    return matchesSearch && matchesType;
  }) ?? [];

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const aDate = new Date(a.createdAt || Date.now());
    const bDate = new Date(b.createdAt || Date.now());

    switch (sortBy) {
      case "newest":
        return bDate.getTime() - aDate.getTime();
      case "oldest":
        return aDate.getTime() - bDate.getTime();
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const documentTypesArray = ["all"].concat(Array.from(new Set(documents?.map(doc => doc.type) ?? [])));

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">Documents Library</h1>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={() => setShowLegend(!showLegend)}
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-9 w-[250px]"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(documentTypes).map(([type, config]) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showLegend && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(documentTypes).map(([type, config]) => (
                    <div key={type} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${config.color}`} />
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedDocuments.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: newDocumentId === doc.id ? [1, 1.02, 1] : 1
                }}
                transition={newDocumentId === doc.id ? {
                  scale: {
                    repeat: Infinity,
                    duration: 1,
                    ease: "easeInOut"
                  }
                } : {
                  duration: 0.3
                }}
                onHoverStart={() => setHoveredId(doc.id)}
                onHoverEnd={() => setHoveredId(null)}
              >
                <Card
                  className={`group hover:border-primary transition-all duration-300 overflow-hidden ${
                    hoveredId === doc.id ? 'shadow-lg scale-[1.02]' : 'shadow-md'
                  } ${newDocumentId === doc.id ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
                >
                  <div className={`h-1 ${getDocumentStripColor(doc.type)}`} />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <motion.div
                          className={`p-2 rounded-lg text-primary ${getDocumentPreviewBackground(doc.type)}`}
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          {getDocumentIcon(doc.type)}
                        </motion.div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {doc.title}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <div className={`w-2 h-2 rounded-full ${getDocumentStripColor(doc.type)}`} />
                      <span className="capitalize">{documentTypes[doc.type]?.label || doc.type}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.createdAt || Date.now()), "PPp")}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="space-y-4"
                      animate={{
                        height: hoveredId === doc.id ? "auto" : "12rem",
                        transition: { duration: 0.3 }
                      }}
                    >
                      {doc.metadata?.subject && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Subject:</span>
                          <span className="text-sm text-muted-foreground">
                            {doc.metadata.subject}
                          </span>
                        </div>
                      )}
                      <motion.div
                        className={`mt-4 overflow-hidden rounded-lg ${
                          hoveredId === doc.id ? 'max-h-48' : 'max-h-32'
                        } transition-all duration-300`}
                      >
                        <div className={`p-4 ${getDocumentPreviewBackground(doc.type)}`}>
                          <pre className="whitespace-pre-wrap text-sm">
                            {doc.content.length > 200
                              ? `${doc.content.slice(0, 200)}...`
                              : doc.content}
                          </pre>
                        </div>
                      </motion.div>
                    </motion.div>
                    {doc.content.length > 200 && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full mt-4 group-hover:bg-primary/10"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          Show More
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {isLoading && (
              <>
                {[1, 2, 3].map((n) => (
                  <Card key={n} className="group animate-pulse">
                    <div className="h-1 bg-primary/20" />
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10" />
                        <div className="h-6 w-32 bg-muted rounded" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-32 bg-primary/5 rounded-lg" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
            {(!sortedDocuments || sortedDocuments.length === 0) && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {searchQuery || selectedType !== "all"
                  ? "No documents match your search criteria."
                  : "No saved documents yet."}
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDocument && (
                <>
                  <div className={`w-2 h-2 rounded-full ${getDocumentStripColor(selectedDocument.type)}`} />
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {getDocumentIcon(selectedDocument.type)}
                  </div>
                  {selectedDocument.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocument?.metadata?.subject && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Subject:</span>
                <span className="text-muted-foreground">
                  {selectedDocument.metadata.subject}
                </span>
              </div>
            )}
            <div className="p-6 bg-muted rounded-lg">
              <pre className="whitespace-pre-wrap">
                {selectedDocument?.content}
              </pre>
            </div>
            <div className="text-sm text-muted-foreground text-right">
              Created: {selectedDocument && format(new Date(selectedDocument.createdAt || Date.now()), "PPp")}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}