import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus } from "lucide-react";
import { CreateVisualizationDialog } from "@/components/visualizations/CreateVisualizationDialog";
import { VisualizationCard } from "@/components/visualizations/VisualizationCard";
import { useVisualizations } from "@/hooks/useVisualizations";
import { Skeleton } from "@/components/ui/skeleton";

export default function Visualizations() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { visualizations, isLoading, deleteVisualization } = useVisualizations();

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display-sm text-foreground mb-2">Visualizations</h1>
            <p className="text-body-md text-muted-foreground">
              Create and manage charts, graphs, and pivot tables
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-display-sm text-foreground mb-2">Visualizations</h1>
          <p className="text-body-md text-muted-foreground">
            Create and manage charts, graphs, and pivot tables
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Visualization
        </Button>
      </div>

      {!visualizations || visualizations.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-heading-md text-foreground mb-2">No visualizations yet</h3>
              <p className="text-body-md text-muted-foreground mb-6">
                Create your first chart or pivot table from your datasets
              </p>
              <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Your First Visualization
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visualizations.map((viz) => (
            <VisualizationCard
              key={viz.id}
              visualization={viz}
              onDelete={deleteVisualization}
            />
          ))}
        </div>
      )}

      <CreateVisualizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
