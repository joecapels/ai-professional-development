import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavBar } from "@/components/nav-bar";
import { Loader2, Search, FileText, MessageSquare, Brain, Filter } from "lucide-react";
import type { SavedDocument } from "@shared/schema";
import { format } from "date-fns";

type SortOption = "newest" | "oldest" | "title";

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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
              <Card
                key={doc.id}
                className="group hover:border-primary transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {getDocumentIcon(doc.type)}
                      </div>
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
                  <div className="space-y-4">
                    {doc.metadata?.subject && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Subject:</span>
                        <span className="text-sm text-muted-foreground">
                          {doc.metadata.subject}
                        </span>
                      </div>
                    )}
                    <div className="mt-4">
                      <div className="p-4 bg-muted rounded-lg max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">
                          {doc.content.length > 200
                            ? `${doc.content.slice(0, 200)}...`
                            : doc.content}
                        </pre>
                      </div>
                    </div>
                  </div>
                  {doc.content.length > 200 && (
                    <Button
                      variant="ghost"
                      className="w-full mt-4 group-hover:bg-primary/10"
                    >
                      Show More
                    </Button>
                  )}
                </CardContent>
              </Card>
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
    </div>
  );
}