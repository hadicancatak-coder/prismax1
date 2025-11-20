import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AdBatchTab() {
  return (
    <div className="h-full overflow-auto p-md space-y-md bg-background">
      {/* Import section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md flex items-center gap-sm">
            <Upload className="h-5 w-5 text-primary" />
            Bulk Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-md">
          <p className="text-body text-muted-foreground">
            Import multiple ads from a CSV file. Download the template to see the required format.
          </p>
          <div className="flex items-center gap-sm">
            <Button variant="outline" className="gap-xs">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <Button className="gap-xs">
              <Upload className="h-4 w-4" />
              Upload CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md flex items-center gap-sm">
            <Download className="h-5 w-5 text-primary" />
            Bulk Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-md">
          <p className="text-body text-muted-foreground">
            Export all ads from selected campaigns to CSV for backup or editing.
          </p>
          <Button variant="outline" className="gap-xs">
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
        </CardContent>
      </Card>

      {/* Validation report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md">Batch Validation Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-md">
          <Alert className="bg-success/10 border-success/30">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              <strong>24 ads</strong> passed all validation checks
            </AlertDescription>
          </Alert>
          <Alert className="bg-warning/10 border-warning/30">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              <strong>3 ads</strong> have warnings that should be reviewed
            </AlertDescription>
          </Alert>
          <Alert className="bg-destructive/10 border-destructive/30">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>1 ad</strong> has critical errors that must be fixed
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
