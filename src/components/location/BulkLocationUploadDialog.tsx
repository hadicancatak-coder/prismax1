import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMediaLocations, LocationType } from "@/hooks/useMediaLocations";
import { Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface BulkLocationUploadDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedRow {
  lineNumber: number;
  data: {
    City: string;
    Type: string;
    Name: string;
    Latitude: string;
    Longitude: string;
    "Manual Score"?: string;
    Agency?: string;
    "Price Per Month"?: string;
    "Historic Prices"?: string;
  };
  errors: string[];
  historicPrices?: Array<{ year: number; price: number }>;
}

const VALID_LOCATION_TYPES: LocationType[] = [
  "Billboard", "Bus Shelter", "Street Furniture", "Transit", "LED Screen", "Other",
  "LED", "Digital Screen", "Unipoles/Megacorns", "Lampposts", "Mupis", "In-Mall Media",
  "Hoardings", "Wall Wraps", "Roof Top Screens", "Airport", "Tram", "Metro", "Elevator Screen"
];

export function BulkLocationUploadDialog({ open, onClose }: BulkLocationUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { createLocation, upsertPrices } = useMediaLocations();

  const validateRow = (row: any): string[] => {
    const errors: string[] = [];

    if (!row.City || row.City.trim() === '') errors.push('City is required');
    if (!row.Name || row.Name.trim() === '') errors.push('Name is required');
    if (!row.Type || row.Type.trim() === '') errors.push('Type is required');

    const lat = parseFloat(row.Latitude);
    const lng = parseFloat(row.Longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) errors.push('Invalid Latitude');
    if (isNaN(lng) || lng < -180 || lng > 180) errors.push('Invalid Longitude');

    if (row.Type && !VALID_LOCATION_TYPES.includes(row.Type as LocationType)) {
      errors.push(`Invalid Type: ${row.Type}`);
    }

    if (row["Manual Score"]) {
      const score = parseInt(row["Manual Score"]);
      if (isNaN(score) || score < 1 || score > 10) {
        errors.push('Manual Score must be 1-10');
      }
    }

    if (row["Price Per Month"]) {
      const price = parseFloat(row["Price Per Month"]);
      if (isNaN(price) || price < 0) {
        errors.push('Invalid Price Per Month');
      }
    }

    return errors;
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    
    const required = ['City', 'Type', 'Name', 'Latitude', 'Longitude'];
    const missing = required.filter(col => !headers.includes(col));
    if (missing.length > 0) {
      throw new Error(`Missing required columns: ${missing.join(', ')}`);
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });

      let historicPrices: Array<{ year: number; price: number }> | undefined;
      if (row['Historic Prices']) {
        try {
          historicPrices = row['Historic Prices']
            .split(';')
            .filter(Boolean)
            .map((entry: string) => {
              const [year, price] = entry.split(':');
              return { year: parseInt(year), price: parseFloat(price) };
            })
            .filter((p: any) => !isNaN(p.year) && !isNaN(p.price));
        } catch (e) {
          // Invalid historic prices format, skip
        }
      }

      return {
        lineNumber: index + 2,
        data: row,
        errors: validateRow(row),
        historicPrices,
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setParsedData(parsed);
        
        const validCount = parsed.filter(r => r.errors.length === 0).length;
        toast({
          title: "CSV parsed successfully",
          description: `Found ${validCount} valid rows out of ${parsed.length} total`,
        });
      } catch (error) {
        toast({
          title: "CSV parsing failed",
          description: error instanceof Error ? error.message : "Invalid CSV format",
          variant: "destructive",
        });
        setFile(null);
        setParsedData([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    const validRows = parsedData.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      toast({
        title: "No valid rows to upload",
        description: "Please fix the errors in your CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const locationData = {
          city: row.data.City,
          type: row.data.Type as LocationType,
          name: row.data.Name,
          latitude: parseFloat(row.data.Latitude),
          longitude: parseFloat(row.data.Longitude),
          manual_score: row.data["Manual Score"] ? parseInt(row.data["Manual Score"]) : undefined,
          agency: row.data.Agency || undefined,
          price_per_month: row.data["Price Per Month"] ? parseFloat(row.data["Price Per Month"]) : undefined,
        };

        const newLocation = await createLocation.mutateAsync(locationData);

        if (row.historicPrices && row.historicPrices.length > 0 && newLocation) {
          await upsertPrices.mutateAsync({
            locationId: newLocation.id,
            prices: row.historicPrices,
          });
        }

        successCount++;
      } catch (error) {
        console.error(`Failed to upload row ${row.lineNumber}:`, error);
        errorCount++;
      }
      
      setUploadProgress(((i + 1) / validRows.length) * 100);
    }

    setIsUploading(false);
    
    toast({
      title: "Upload complete",
      description: `Successfully uploaded ${successCount} locations. ${errorCount} failed.`,
      variant: errorCount > 0 ? "destructive" : "default",
    });

    if (successCount > 0) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setUploadProgress(0);
    onClose();
  };

  const validRowsCount = parsedData.filter(r => r.errors.length === 0).length;
  const errorRowsCount = parsedData.filter(r => r.errors.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Upload Locations</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: City, Type, Name, Latitude, Longitude, Manual Score, Agency, Price Per Month, Historic Prices
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-auto">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <Button
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                }}
                variant="ghost"
                size="sm"
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {parsedData.length > 0 && (
            <>
              <div className="flex gap-4 text-sm">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {validRowsCount} Valid
                </Badge>
                {errorRowsCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errorRowsCount} Errors
                  </Badge>
                )}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-muted-foreground">
                    Uploading locations... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <div className="border rounded-lg overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Lat/Lng</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row) => (
                      <TableRow key={row.lineNumber} className={row.errors.length > 0 ? "bg-destructive/10" : ""}>
                        <TableCell className="font-mono text-xs">{row.lineNumber}</TableCell>
                        <TableCell>{row.data.City}</TableCell>
                        <TableCell>{row.data.Type}</TableCell>
                        <TableCell>{row.data.Name}</TableCell>
                        <TableCell className="text-xs">
                          {row.data.Latitude}, {row.data.Longitude}
                        </TableCell>
                        <TableCell>
                          {row.errors.length === 0 ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Valid
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              {row.errors.map((error, i) => (
                                <Badge key={i} variant="destructive" className="gap-1 block">
                                  <AlertCircle className="h-3 w-3" />
                                  {error}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={handleClose} variant="outline" disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || validRowsCount === 0 || isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload {validRowsCount} Locations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
