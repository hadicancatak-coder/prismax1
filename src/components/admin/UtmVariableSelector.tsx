import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { UTM_VARIABLE_CATEGORIES } from "@/lib/utmVariables";

interface UtmVariableSelectorProps {
  onSelect: (variable: string) => void;
}

export function UtmVariableSelector({ onSelect }: UtmVariableSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (variable: string) => {
    onSelect(variable);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Variable
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="max-h-[400px] overflow-y-auto">
          {UTM_VARIABLE_CATEGORIES.map((category) => (
            <div key={category.name} className="border-b last:border-b-0">
              <div className="px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
                {category.name}
              </div>
              <div className="p-1">
                {category.variables.map((variable) => (
                  <button
                    key={variable.key}
                    onClick={() => handleSelect(variable.key)}
                    className="w-full text-left px-3 py-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{variable.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {variable.description}
                        </div>
                      </div>
                      <code className="text-xs bg-muted px-2 py-1 rounded ml-2">
                        {variable.example}
                      </code>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
