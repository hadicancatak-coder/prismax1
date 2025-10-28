import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveAllFixedErrors } from "@/utils/resolveErrorLogs";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ResolveErrors() {
  const [isResolving, setIsResolving] = useState(false);
  const [result, setResult] = useState<{ successful: number; failed: number } | null>(null);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const res = await resolveAllFixedErrors();
      setResult(res);
      toast.success(`Resolved ${res.successful} errors successfully`);
      if (res.failed > 0) {
        toast.warning(`${res.failed} errors failed to resolve`);
      }
    } catch (error) {
      toast.error('Failed to resolve errors');
      console.error(error);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Resolve Fixed Error Logs</CardTitle>
          <CardDescription>
            Mark all previously fixed errors as resolved. This includes:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Select.Item empty string errors (9 errors)</li>
              <li>useDefaultAssignees not defined errors (6 errors)</li>
              <li>Unhandled Promise Rejections (2 errors)</li>
              <li>Obsolete handleSaveScopeOfWork error (1 error)</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleResolve} 
            disabled={isResolving}
            className="w-full"
          >
            {isResolving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resolving Errors...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Resolve All Fixed Errors
              </>
            )}
          </Button>

          {result && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">Results:</p>
              <p className="text-sm text-muted-foreground">
                ✅ Successfully resolved: {result.successful}
              </p>
              {result.failed > 0 && (
                <p className="text-sm text-destructive">
                  ❌ Failed: {result.failed}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
