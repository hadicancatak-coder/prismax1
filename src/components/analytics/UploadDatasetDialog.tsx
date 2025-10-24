import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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
      // Parse CSV file
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length === 0) {
        throw new Error("CSV file is empty");
      }

      // Parse headers
      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      const dataRows = lines.slice(1);

      // Create column definitions
      const columnDefinitions = headers.map((header) => ({
        name: header,
        type: "text",
      }));

      // Create dataset
      const { data: dataset, error: datasetError } = await supabase
        .from("datasets")
        .insert({
          user_id: user?.id,
          name,
          description,
          source_type: "csv_upload",
          column_definitions: columnDefinitions,
          row_count: dataRows.length,
        })
        .select()
        .single();

      if (datasetError) throw datasetError;

      // Insert rows in batches
      const batchSize = 100;
      for (let i = 0; i < dataRows.length; i += batchSize) {
        const batch = dataRows.slice(i, i + batchSize);
        const rowInserts = batch.map((row, index) => {
          const values = row.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const rowData: Record<string, string> = {};
          headers.forEach((header, colIndex) => {
            rowData[header] = values[colIndex] || "";
          });
          return {
            dataset_id: dataset.id,
            row_number: i + index + 1,
            data: rowData,
          };
        });

        const { error: rowsError } = await supabase.from("dataset_rows").insert(rowInserts);
        if (rowsError) throw rowsError;
      }

      return dataset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast({ title: "Success", description: "Dataset uploaded successfully" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
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

    setIsUploading(true);
    uploadMutation.mutate({ name, description, file });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Dataset</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create a new dataset for analysis
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Dataset Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sales Data 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your dataset..."
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
      </DialogContent>
    </Dialog>
  );
}
