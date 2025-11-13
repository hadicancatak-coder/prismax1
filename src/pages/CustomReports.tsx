import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, FolderOpen, FileSpreadsheet } from "lucide-react";
import { SpreadsheetTable } from "@/components/reports/SpreadsheetTable";
import { toast } from "@/hooks/use-toast";
import type { SpreadsheetData } from "@/lib/formulaParser";

export default function CustomReports() {
  const [reportName, setReportName] = useState("Untitled Report");
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData>({});

  const handleSave = () => {
    // In a real implementation, this would save to the database
    const dataStr = JSON.stringify({
      name: reportName,
      data: spreadsheetData,
      savedAt: new Date().toISOString(),
    });
    
    localStorage.setItem(`report_${Date.now()}`, dataStr);
    
    toast({
      title: "Report Saved",
      description: `"${reportName}" has been saved successfully.`,
    });
  };

  const handleLoad = () => {
    // In a real implementation, this would show a dialog to select from saved reports
    toast({
      title: "Load Report",
      description: "This feature will allow you to load previously saved reports.",
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-8 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title">Custom Reports</h1>
          <p className="text-body text-muted-foreground">
            Create custom reports with formula-powered spreadsheet tables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleLoad}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Load
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <Label htmlFor="reportName" className="text-sm text-muted-foreground">
                Report Name
              </Label>
              <Input
                id="reportName"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="mt-1 font-medium"
                placeholder="Enter report name..."
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="spreadsheet" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="spreadsheet">Spreadsheet</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            <TabsContent value="spreadsheet" className="mt-6">
              <SpreadsheetTable onDataChange={setSpreadsheetData} />
            </TabsContent>
            
            <TabsContent value="about" className="mt-6">
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">About Custom Reports</h3>
                  <p>
                    Custom Reports provides a powerful spreadsheet interface for creating dynamic reports with formula support.
                    Perfect for data analysis, budget planning, and performance tracking.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Features</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Add/remove rows and columns dynamically</li>
                    <li>Excel-like cell referencing (A1, B2, etc.)</li>
                    <li>Formula support with real-time calculations</li>
                    <li>Functions: SUM, AVG, MIN, MAX, COUNT</li>
                    <li>Mathematical expressions with cell references</li>
                    <li>Export to CSV</li>
                    <li>Save and load reports</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Keyboard Shortcuts</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Double-click cell to edit</li>
                    <li>Enter - Move down</li>
                    <li>Tab - Move right</li>
                    <li>Arrow keys - Navigate cells</li>
                    <li>Escape - Cancel edit</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-900 dark:text-blue-100">
                    <strong>Tip:</strong> Formula cells are highlighted in blue. All formulas start with "=" character.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
