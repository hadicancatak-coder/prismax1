import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Database, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateVisualizationDialog } from "@/components/visualizations/CreateVisualizationDialog";

export default function DatasetViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [createVizOpen, setCreateVizOpen] = useState(false);
  
  const { data: dataset, isLoading } = useQuery({
    queryKey: ['dataset', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: sampleRows } = useQuery({
    queryKey: ['dataset-rows', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dataset_rows')
        .select('*')
        .eq('dataset_id', id)
        .limit(10)
        .order('row_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-muted-foreground">Dataset not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/data-sources')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Data Sources
        </Button>
        <Button onClick={() => setCreateVizOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Visualization
        </Button>
      </div>

      {/* Dataset Header with Metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{dataset.name}</CardTitle>
              {dataset.description && (
                <CardDescription className="mt-2">{dataset.description}</CardDescription>
              )}
            </div>
            {dataset.detected_type && (
              <Badge variant="secondary" className="capitalize">
                {dataset.detected_type.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="h-4 w-4" />
                <Label className="text-xs font-normal">Granularity</Label>
              </div>
              <p className="font-semibold text-foreground capitalize">
                {dataset.granularity || 'N/A'}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Database className="h-4 w-4" />
                <Label className="text-xs font-normal">Total Rows</Label>
              </div>
              <p className="font-semibold text-foreground">
                {dataset.row_count?.toLocaleString() || 0}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <Label className="text-xs font-normal">Date Range</Label>
              </div>
              <p className="font-semibold text-foreground text-sm">
                {dataset.date_range_start && dataset.date_range_end
                  ? `${format(new Date(dataset.date_range_start), 'MMM d, yy')} - ${format(new Date(dataset.date_range_end), 'MMM d, yy')}`
                  : 'N/A'}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="h-4 w-4" />
                <Label className="text-xs font-normal">KPIs</Label>
              </div>
              <p className="font-semibold text-foreground">
                {dataset.primary_kpi_fields?.length || 0}
              </p>
            </div>
          </div>
          
          {dataset.primary_kpi_fields && dataset.primary_kpi_fields.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <Label className="text-sm text-muted-foreground mb-3 block">Primary Metrics</Label>
              <div className="flex flex-wrap gap-2">
                {dataset.primary_kpi_fields.map((kpi: string) => (
                  <Badge key={kpi} variant="outline" className="bg-primary/5">
                    {kpi}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>First 10 rows of your dataset</CardDescription>
        </CardHeader>
        <CardContent>
          {sampleRows && sampleRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-semibold text-foreground">Row #</th>
                    {Object.keys(sampleRows[0].data).map((key) => (
                      <th key={key} className="text-left p-3 text-sm font-semibold text-foreground">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row) => (
                    <tr key={row.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 text-sm text-muted-foreground">{row.row_number}</td>
                      {Object.values(row.data).map((value: any, idx) => (
                        <td key={idx} className="p-3 text-sm text-foreground">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      <CreateVisualizationDialog
        open={createVizOpen}
        onOpenChange={setCreateVizOpen}
        defaultDatasetId={id}
      />
    </div>
  );
}
