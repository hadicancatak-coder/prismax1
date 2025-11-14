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
      {/* Floating toggle button - always visible */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className="fixed left-4 top-24 z-50 shadow-md bg-card"
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Sidebar panel */}
      <div className={cn(
        "fixed left-16 top-24 z-50 transition-all duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="bg-card border rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col gap-1 p-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAddElement('table')}
                    className="h-12 w-12"
                  >
                    <Table className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Add Table</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAddElement('text')}
                    className="h-12 w-12"
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Add Text Block</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAddElement('chart')}
                    className="h-12 w-12"
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Add Chart</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAddElement('image')}
                    className="h-12 w-12"
                  >
                    <Image className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Add Image</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </>
  );
}
