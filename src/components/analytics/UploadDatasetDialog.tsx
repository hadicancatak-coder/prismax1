import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, AlertCircle, FileSpreadsheet } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { parseCSV } from "@/lib/csvParser";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { errorLogger } from "@/lib/errorLogger";
import { GoogleSheetsConnector } from "./GoogleSheetsConnector";

interface UploadDatasetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDatasetDialog({ open, onOpenChange }: UploadDatasetDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [parsedSummary, setParsedSummary] = useState<any>(null);
  const [showGoogleSheets, setShowGoogleSheets] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async ({
      name,
      description,
      file,
    }: {
      name: string;
      description: string;
      file: File;
    }) => {
      try {
        const parsed = await parseCSV(file);
        
        if (!parsed.normalizedRows || parsed.normalizedRows.length === 0) {
          throw new Error("CSV file contains no valid data rows");
        }
      
      if (!user?.id) {
        throw new Error("User must be logged in to upload datasets");
      }

      const { data: dataset, error: datasetError } = await supabase
        .from("datasets")
        .insert([{
          user_id: user.id,
          name: name || parsed.datasetName,
          description,
          source_type: "csv_upload",
          column_definitions: parsed.columnDefinitions as any,
          row_count: parsed.normalizedRows.length,
          granularity: parsed.granularity,
          primary_kpi_fields: parsed.primaryKpiFields,
          date_range_start: parsed.dateRange.start?.toISOString().split('T')[0],
          date_range_end: parsed.dateRange.end?.toISOString().split('T')[0],
          detected_type: parsed.detectedType,
          has_dimensions: parsed.hasDimensions,
          dimension_values: parsed.dimensionValues,
          parsing_metadata: parsed.parsingMetadata as any,
        }])
        .select()
        .single();
      
      if (datasetError) throw datasetError;
      
      const batchSize = 500;
      for (let i = 0; i < parsed.normalizedRows.length; i += batchSize) {
        const batch = parsed.normalizedRows.slice(i, i + batchSize);
        const rowInserts = batch.map((row, index) => ({
          dataset_id: dataset.id,
          row_number: i + index + 1,
          dimension: row.dimension,
          dimension_type: row.dimension_type,
          time_key_parsed: row.time_key_parsed?.toISOString().split('T')[0],
          data: {
            time_key: row.time_key,
            time_key_parsed: row.time_key_parsed?.toISOString(),
            metric_name: row.metric_name,
            metric_value: row.metric_value,
            metric_unit: row.metric_unit,
            ...row.raw_data
          },
        }));
        
        const { error: rowsError } = await supabase.from("dataset_rows").insert(rowInserts);
        if (rowsError) throw rowsError;
      }
      
        return { dataset, parsed };
      } catch (parseError: any) {
        throw new Error(`Failed to parse CSV: ${parseError.message || 'Unknown error'}`);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      setParsedSummary(data.parsed);
      setShowSummary(true);
      toast({ 
        title: "Success", 
        description: `Dataset imported: ${data.parsed.detectedType} | ${data.parsed.normalizedRows.length} metrics parsed` 
      });
      resetForm();
    },
    onError: (error: Error) => {
      errorLogger.logError({
        severity: 'warning',
        type: 'frontend',
        message: `CSV upload failed: ${error.message}`,
        metadata: { fileName: file?.name, fileSize: file?.size }
      });
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setFile(null);
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    if (!user?.id) {
      toast({ title: "Error", description: "You must be logged in to upload datasets", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync({ name, description, file });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast({ title: "Error", description: "Please select a CSV file", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleGoogleSheetsConnect = async (data: {
    name: string;
    description: string;
    googleSheetUrl: string;
    googleSheetId: string;
    syncFrequency: 'manual' | 'hourly' | 'daily';
  }) => {
    try {
      const { data: dataset, error } = await supabase
        .from('datasets')
        .insert({
          name: data.name,
          description: data.description,
          source_type: 'google_sheets',
          google_sheet_url: data.googleSheetUrl,
          google_sheet_id: data.googleSheetId,
          sync_frequency: data.syncFrequency,
          user_id: user?.id,
          column_definitions: [],
          row_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Success", description: "Google Sheet connected successfully! Data will sync shortly." });
      setShowGoogleSheets(false);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    } catch (error) {
      console.error('Error connecting Google Sheet:', error);
      toast({ title: "Error", description: "Failed to connect Google Sheet", variant: "destructive" });
    }
  };

  return (
    <>
      <GoogleSheetsConnector
        open={showGoogleSheets}
        onOpenChange={setShowGoogleSheets}
        onConnect={handleGoogleSheetsConnect}
      />

      <Dialog open={open && !showSummary} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Dataset</DialogTitle>
          <DialogDescription>
            Upload a CSV file or connect a Google Sheet
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </TabsTrigger>
            <TabsTrigger value="google-sheets">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Google Sheets
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="csv" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Dataset Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Weekly Performance Data"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this dataset contain?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">CSV File *</Label>
                <div className="relative">
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="cursor-pointer file:cursor-pointer"
                    required
                  />
                </div>
                {file && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mt-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading || !file || !name} className="gap-2">
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Dataset
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="google-sheets" className="mt-4">
            <div className="text-center py-8 space-y-4">
              <FileSpreadsheet className="h-16 w-16 mx-auto text-primary" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Connect Google Sheets</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import data directly from Google Sheets with automatic syncing
                </p>
              </div>
              <Button onClick={() => {
                setShowGoogleSheets(true);
                onOpenChange(false);
              }}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Connect Google Sheet
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    <Dialog open={showSummary} onOpenChange={setShowSummary}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Summary</DialogTitle>
          <DialogDescription>
            Your dataset has been successfully imported and parsed
          </DialogDescription>
        </DialogHeader>
        
        {parsedSummary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Dataset Type</Label>
                <p className="font-semibold text-foreground capitalize">
                  {parsedSummary.detectedType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Granularity</Label>
                <p className="font-semibold text-foreground capitalize">{parsedSummary.granularity}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Total Metrics</Label>
                <p className="font-semibold text-foreground">{parsedSummary.normalizedRows.length.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Date Range</Label>
                <p className="font-semibold text-foreground">
                  {parsedSummary.dateRange.start && parsedSummary.dateRange.end 
                    ? `${parsedSummary.dateRange.start.toLocaleDateString()} - ${parsedSummary.dateRange.end.toLocaleDateString()}`
                    : 'N/A'}
                </p>
              </div>
            </div>
            
            {parsedSummary.primaryKpiFields.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Detected KPIs</Label>
                <div className="flex flex-wrap gap-2">
                  {parsedSummary.primaryKpiFields.map((kpi: string) => (
                    <Badge key={kpi} variant="secondary">{kpi}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {parsedSummary.parsingMetadata.unpivotApplied && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Data Transformation Applied</AlertTitle>
                <AlertDescription>
                  Monthly columns were unpivoted into a time-series format for better analysis.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => {
            setShowSummary(false);
            onOpenChange(false);
          }}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
