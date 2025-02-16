import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NavBar } from "@/components/nav-bar";
import { Loader2, Search, FileText, MessageSquare, Brain, Filter } from "lucide-react";
import type { SavedDocument } from "@shared/schema";
import { format } from "date-fns";
import { motion } from "framer-motion";

type SortOption = "newest" | "oldest" | "title";

const getDocumentPreviewBackground = (type: string) => {
  switch (type) {
    case "chat":
      return "bg-blue-100 dark:bg-blue-900/20";
    case "quiz":
      return "bg-green-100 dark:bg-green-900/20";
    default:
      return "bg-orange-100 dark:bg-orange-900/20";
  }
};

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedDocument, setSelectedDocument] = useState<SavedDocument | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const { data: documents, isLoading } = useQuery<SavedDocument[]>({
    queryKey: ["/api/documents"],
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "chat":
        return <MessageSquare className="h-5 w-5" />;
      case "quiz":
        return <Brain className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const sortedDocuments = [...(filteredDocuments || [])].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const documentTypes = ["all", ...new Set(documents?.map(doc => doc.type) || [])];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Documents Library</h1>
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
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedDocuments?.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onHoverStart={() => setHoveredId(doc.id)}
                onHoverEnd={() => setHoveredId(null)}
              >
                <Card
                  className={`group hover:border-primary transition-all duration-300 ${
                    hoveredId === doc.id ? 'shadow-lg scale-[1.02]' : 'shadow-md'
                  }`}
                >
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
                      <span className="capitalize">{doc.type}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.createdAt), "PPp")}</span>
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
                        className={`mt-4 overflow-hidden ${
                          hoveredId === doc.id ? 'max-h-48' : 'max-h-32'
                        } transition-all duration-300`}
                      >
                        <div className={`p-4 ${getDocumentPreviewBackground(doc.type)} rounded-lg`}>
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
              Created: {selectedDocument && format(new Date(selectedDocument.createdAt), "PPp")}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}