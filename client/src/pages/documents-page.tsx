import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavBar } from "@/components/nav-bar";
import { Loader2 } from "lucide-react";
import type { SavedDocument } from "@shared/schema";
import { format } from "date-fns";

export default function DocumentsPage() {
  const { data: documents, isLoading } = useQuery<SavedDocument[]>({
    queryKey: ["/api/documents"],
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

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Saved Documents</h1>

          <div className="grid gap-6">
            {documents?.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{doc.title}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(doc.createdAt), "PPp")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Type:</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {doc.type}
                      </span>
                    </div>
                    {doc.metadata?.subject && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Subject:</span>
                        <span className="text-sm text-muted-foreground">
                          {doc.metadata.subject}
                        </span>
                      </div>
                    )}
                    <div className="mt-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">
                          {doc.content}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!documents || documents.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No saved documents yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}