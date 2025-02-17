import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleEllipsis } from "lucide-react";

export default function OneRingPage() {
  return (
    <div className="container mx-auto p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CircleEllipsis className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">The One Ring</CardTitle>
          <CardDescription>
            Master your professional development journey with ultimate wisdom and power
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Access the collective wisdom of professional development
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Power</h3>
              <p className="text-sm text-muted-foreground">
                Unlock advanced learning capabilities and insights
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Leadership</h3>
              <p className="text-sm text-muted-foreground">
                Guide others on their professional journey
              </p>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button size="lg" className="w-full md:w-auto">
              Begin Your Journey
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}