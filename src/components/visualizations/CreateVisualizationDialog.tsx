import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartTypeSelector } from "./ChartTypeSelector";
import { ColumnMapper } from "./ColumnMapper";
import { ChartRenderer } from "./ChartRenderer";
import { useVisualizations } from "@/hooks/useVisualizations";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CreateVisualizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDatasetId?: string;
}

export function CreateVisualizationDialog({ open, onOpenChange, defaultDatasetId }: CreateVisualizationDialogProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [datasetId, setDatasetId] = useState(defaultDatasetId || "");
  const [chartType, setChartType] = useState("bar");
  const [config, setConfig] = useState<Record<string, any>>({});

  const { createVisualization } = useVisualizations();

  const { data: datasets } = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('datasets')
        .select('id, name')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: sampleData } = useQuery({
    queryKey: ['dataset-sample', datasetId],
    queryFn: async () => {
      if (!datasetId) return [];
      const { data, error } = await supabase
        .from('dataset_rows')
        .select('data')
        .eq('dataset_id', datasetId)
        .limit(100);
      if (error) throw error;
      return data.map(row => row.data);
    },
    enabled: !!datasetId,
  });

  const columns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];

  useEffect(() => {
    if (defaultDatasetId) {
      setDatasetId(defaultDatasetId);
      setStep(2);
    }
  }, [defaultDatasetId]);

  const handleCreate = () => {
    createVisualization({
      dataset_id: datasetId,
      name,
      description: description || null,
      viz_type: chartType as any,
      config,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setDatasetId(defaultDatasetId || "");
    setChartType("bar");
    setConfig({});
  };

  const canProceed = () => {
    if (step === 1) return datasetId !== "";
    if (step === 2) return chartType !== "";
    if (step === 3) {
      if (chartType === 'table') return true;
      if (chartType === 'pie') return config.labelField && config.valueField;
      return config.xAxis && config.yAxis;
    }
    if (step === 4) return name !== "";
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Visualization - Step {step} of 4</DialogTitle>
          <DialogDescription>
            {step === 1 && "Select a dataset to visualize"}
            {step === 2 && "Choose the type of chart you want to create"}
            {step === 3 && "Map your data columns to chart elements"}
            {step === 4 && "Name your visualization and preview"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-2">
              <Label>Select Dataset</Label>
              <Select value={datasetId} onValueChange={setDatasetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets?.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 2 && (
            <ChartTypeSelector selected={chartType} onSelect={setChartType} />
          )}

          {step === 3 && (
            <ColumnMapper
              columns={columns}
              chartType={chartType}
              config={config}
              onChange={setConfig}
            />
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Visualization Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sales by Month"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this visualization shows..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <ChartRenderer
                  chartType={chartType}
                  data={sampleData || []}
                  config={config}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              onClick={() => step === 4 ? handleCreate() : setStep(step + 1)}
              disabled={!canProceed()}
            >
              {step === 4 ? 'Create' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
