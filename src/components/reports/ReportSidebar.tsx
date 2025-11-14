import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, FileText, BarChart3, Image, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportSidebarProps {
  onAddElement: (type: 'table' | 'text' | 'chart' | 'image') => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ReportSidebar({ onAddElement, isOpen, onToggle }: ReportSidebarProps) {
  return (
    <>
      {/* Toggle button - always visible with higher z-index */}
      <Button
        onClick={onToggle}
        size="icon"
        variant="outline"
        className={cn(
          "fixed top-24 z-[60] shadow-lg transition-all duration-300",
          isOpen ? "left-[17rem]" : "left-4"
        )}
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed left-4 top-24 z-50 w-64 rounded-lg border bg-card p-4 shadow-lg transition-all duration-300",
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        )}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">Add Elements</h3>
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => onAddElement('table')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Table className="mr-2 h-4 w-4" />
                      Add Table
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insert a data table with spreadsheet capabilities</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => onAddElement('text')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Add Text
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insert a rich text block</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => onAddElement('chart')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Add Chart
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insert a chart (bar, line, area)</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => onAddElement('image')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Image className="mr-2 h-4 w-4" />
                      Add Image
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insert an image with optional caption</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
