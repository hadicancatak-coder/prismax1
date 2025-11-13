import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, FolderOpen, Download, FileJson } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ReportSidebar } from "@/components/reports/ReportSidebar";
import { ReportCanvas } from "@/components/reports/ReportCanvas";
import { GlobalBubbleMenu } from "@/components/editor/GlobalBubbleMenu";
import type { ReportDocument, ReportElement } from "@/types/report";
import { createTableElement, createTextElement, exportReportToJSON } from "@/lib/reportHelpers";

export default function CustomReports() {
  const [report, setReport] = useState<ReportDocument>({
    id: crypto.randomUUID(),
    name: "Untitled Report",
    elements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleAddElement = (type: 'table' | 'text' | 'chart' | 'image') => {
    const position = report.elements.length;
    let newElement: ReportElement;

    switch (type) {
      case 'table':
        newElement = createTableElement(position);
        break;
      case 'text':
        newElement = createTextElement(position);
        break;
      default:
        toast({
          title: "Coming Soon",
          description: `${type} elements will be available in a future phase.`,
        });
        return;
    }

    setReport((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
      updatedAt: new Date().toISOString(),
    }));

    setActiveElementId(newElement.id);

    toast({
      title: "Element Added",
      description: `${type} element has been added to the report.`,
    });
  };

  const handleElementsReorder = (elements: ReportElement[]) => {
    setReport((prev) => ({
      ...prev,
      elements,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleElementUpdate = (id: string, data: any) => {
    setReport((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, data } : el
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleElementDelete = (id: string) => {
    setReport((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
      updatedAt: new Date().toISOString(),
    }));

    if (activeElementId === id) {
      setActiveElementId(null);
    }

    toast({
      title: "Element Deleted",
      description: "The element has been removed from the report.",
    });
  };

  const handleElementDuplicate = (id: string) => {
    const element = report.elements.find((el) => el.id === id);
    if (!element) return;

    const newElement: ReportElement = {
      ...element,
      id: `${element.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: report.elements.length,
    };

    setReport((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
      updatedAt: new Date().toISOString(),
    }));

    toast({
      title: "Element Duplicated",
      description: "A copy of the element has been added to the report.",
    });
  };

  const handleSave = () => {
    const dataStr = JSON.stringify(report);
    localStorage.setItem(`report_${report.id}`, dataStr);
    
    toast({
      title: "Report Saved",
      description: `"${report.name}" has been saved successfully.`,
    });
  };

  const handleExportJSON = () => {
    const json = exportReportToJSON(report);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "JSON file has been downloaded.",
    });
  };

  const handleLoad = () => {
    toast({
      title: "Load Report",
      description: "This feature will allow you to load previously saved reports.",
    });
  };

  return (
    <>
      <GlobalBubbleMenu />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <Label htmlFor="reportName" className="text-xs text-muted-foreground">
                Report Name
              </Label>
              <Input
                id="reportName"
                value={report.name}
                onChange={(e) => setReport({ ...report, name: e.target.value })}
                className="mt-1 font-medium"
                placeholder="Enter report name..."
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleLoad}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Load
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON}>
                <FileJson className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <ReportSidebar
          onAddElement={handleAddElement}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Canvas */}
        <ReportCanvas
          elements={report.elements}
          activeElementId={activeElementId}
          onElementsReorder={handleElementsReorder}
          onElementSelect={setActiveElementId}
          onElementUpdate={handleElementUpdate}
          onElementDelete={handleElementDelete}
          onElementDuplicate={handleElementDuplicate}
        />
      </div>
    </>
  );
}
