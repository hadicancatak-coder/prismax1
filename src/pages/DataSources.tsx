import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Upload, Plus, RefreshCw, Trash2, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { UploadDatasetDialog } from "@/components/analytics/UploadDatasetDialog";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DataSources() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  const { data: datasets, isLoading } = useQuery({
    queryKey: ["datasets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("datasets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (datasetId: string) => {
      const { error } = await supabase.from("datasets").delete().eq("id", datasetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast({ title: "Success", description: "Dataset deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedDatasetId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDatasetId) {
      deleteMutation.mutate(selectedDatasetId);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "csv_upload":
        return <Upload className="h-5 w-5" />;
      case "google_sheets":
        return <Database className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case "csv_upload":
        return "CSV Upload";
      case "google_sheets":
        return "Google Sheets";
      case "manual":
        return "Manual Entry";
      default:
        return sourceType;
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-display-sm text-gray-900 mb-2">Data Sources</h1>
          <p className="text-body-md text-gray-600">
            Upload and manage your datasets for analysis and visualization
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Dataset
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : datasets && datasets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <Card
              key={dataset.id}
              className="group cursor-pointer transition-all hover:shadow-lg"
              onClick={() => navigate(`/data-sources/${dataset.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      {getSourceIcon(dataset.source_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{dataset.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {dataset.row_count?.toLocaleString() || 0} rows
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dataset.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{dataset.description}</p>
                )}
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {getSourceLabel(dataset.source_type)}
                  </Badge>
                  {dataset.last_synced_at && (
                    <Badge variant="outline" className="text-xs">
                      Synced {format(new Date(dataset.last_synced_at), "MMM d")}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/data-sources/${dataset.id}`);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </Button>
                  {dataset.source_type === "google_sheets" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({ title: "Syncing...", description: "Feature coming soon" });
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(dataset.id);
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <Database className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-heading-md text-gray-900 mb-2">No data sources yet</h3>
              <p className="text-body-md text-gray-600 mb-6">
                Get started by uploading your first dataset
              </p>
              <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Dataset
              </Button>
            </div>
          </div>
        </Card>
      )}

      <UploadDatasetDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the dataset and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
