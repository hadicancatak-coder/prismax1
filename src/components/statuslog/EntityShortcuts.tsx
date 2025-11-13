import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { useState, useEffect } from "react";
import { CustomizeShortcutsDialog } from "./CustomizeShortcutsDialog";

interface EntityShortcutsProps {
  logs: any[];
  selectedEntity?: string;
  onEntityClick: (entity: string) => void;
}

export const EntityShortcuts = ({ logs, selectedEntity, onEntityClick }: EntityShortcutsProps) => {
  const { data: allEntities = [] } = useSystemEntities();
  const [preferredEntityIds, setPreferredEntityIds] = useState<string[]>([]);
  const [showCustomize, setShowCustomize] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("statusLogEntityShortcuts");
    if (saved) {
      setPreferredEntityIds(JSON.parse(saved));
    } else {
      // Default to first 6 entities by display order
      setPreferredEntityIds(allEntities.slice(0, 6).map(e => e.id));
    }
  }, [allEntities]);

  // Calculate log counts per entity
  const entityCounts = logs.reduce((acc, log) => {
    if (log.entity) {
      acc[log.entity] = (acc[log.entity] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Get entities to display
  const displayEntities = preferredEntityIds
    .map(id => allEntities.find(e => e.id === id))
    .filter(Boolean)
    .slice(0, 8);

  const handleSavePreferences = (entityIds: string[]) => {
    setPreferredEntityIds(entityIds);
    localStorage.setItem("statusLogEntityShortcuts", JSON.stringify(entityIds));
  };

  if (displayEntities.length === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Quick Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCustomize(true)}
          className="h-8"
        >
          <Settings2 className="h-4 w-4 mr-1" />
          Customize
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        {displayEntities.map((entity) => {
          const count = entityCounts[entity.name] || 0;
          const isActive = selectedEntity === entity.name;

          return (
            <Card
              key={entity.id}
              className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                isActive ? "ring-2 ring-primary bg-accent" : "hover:bg-accent/50"
              }`}
              onClick={() => onEntityClick(isActive ? "" : entity.name)}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="text-2xl">{entity.emoji || "📋"}</div>
                <div className="space-y-1">
                  <div className="text-sm font-medium line-clamp-1">{entity.name}</div>
                  <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                    {count}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <CustomizeShortcutsDialog
        open={showCustomize}
        onOpenChange={setShowCustomize}
        allEntities={allEntities}
        selectedEntityIds={preferredEntityIds}
        onSave={handleSavePreferences}
      />
    </>
  );
};
