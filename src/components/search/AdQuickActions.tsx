import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdQuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 md:bottom-8 right-8 z-50 flex flex-col-reverse items-end gap-sm">
      {/* Speed dial actions */}
      {isOpen && (
        <div className="flex flex-col-reverse gap-sm animate-scale-in">
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-lg hover-lift"
            onClick={() => console.log("Create Ad")}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-lg hover-lift"
            onClick={() => console.log("Duplicate")}
          >
            <Copy className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-lg hover-lift"
            onClick={() => console.log("Save Template")}
          >
            <Save className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-smooth card-glow",
          isOpen && "rotate-45"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
