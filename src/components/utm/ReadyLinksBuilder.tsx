import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Construction } from "lucide-react";

export function ReadyLinksBuilder() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ready Links Generator</CardTitle>
          <CardDescription>
            Add landing pages and automatically generate UTM links with rule-based parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Construction className="h-4 w-4" />
            <AlertDescription>
              This feature is coming soon. You'll be able to add landing pages, configure countries, 
              languages, and platforms, and automatically generate UTM links based on predefined rules.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
