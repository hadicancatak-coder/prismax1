import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Maximize2 } from "lucide-react";
import { ChartRenderer } from "./ChartRenderer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Visualization } from "@/hooks/useVisualizations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VisualizationCardProps {
  visualization: Visualization;
  onDelete: (id: string) => void;
}

export function VisualizationCard({ visualization, onDelete }: VisualizationCardProps) {
  const { data: chartData } = useQuery({
    queryKey: ['visualization-data', visualization.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dataset_rows')
        .select('data')
        .eq('dataset_id', visualization.dataset_id)
        .limit(100);
      if (error) throw error;
      return data.map(row => row.data);
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{visualization.name}</CardTitle>
            {visualization.description && (
              <CardDescription>{visualization.description}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Visualization</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{visualization.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(visualization.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartRenderer
          chartType={visualization.viz_type}
          data={chartData || []}
          config={visualization.config}
        />
      </CardContent>
    </Card>
  );
}
