import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface GoogleSheetsConnectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (data: {
    name: string;
    description: string;
    googleSheetUrl: string;
    googleSheetId: string;
    syncFrequency: 'manual' | 'hourly' | 'daily';
  }) => void;
}

export function GoogleSheetsConnector({ 
  open, 
  onOpenChange, 
  onConnect 
}: GoogleSheetsConnectorProps) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [datasetName, setDatasetName] = useState("");
  const [description, setDescription] = useState("");
  const [syncFrequency, setSyncFrequency] = useState<'manual' | 'hourly' | 'daily'>('manual');
  
  const extractSheetId = (url: string): string | null => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };
  
  const handleConnect = () => {
    if (!sheetUrl || !datasetName) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const sheetId = extractSheetId(sheetUrl);
    
    if (!sheetId) {
      toast.error("Invalid Google Sheets URL. Please use a valid share link.");
      return;
    }
    
    onConnect({
      name: datasetName,
      description,
      googleSheetUrl: sheetUrl,
      googleSheetId: sheetId,
      syncFrequency
    });
    
    // Reset form
    setSheetUrl("");
    setDatasetName("");
    setDescription("");
    setSyncFrequency('manual');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Connect Google Sheet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sheet-url">Google Sheets URL *</Label>
            <Input 
              id="sheet-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Share your Google Sheet publicly or with view access
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dataset-name">Dataset Name *</Label>
            <Input 
              id="dataset-name"
              placeholder="e.g., Weekly Performance Data"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What does this dataset contain?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sync-frequency">Sync Frequency</Label>
            <Select value={syncFrequency} onValueChange={(v: any) => setSyncFrequency(v)}>
              <SelectTrigger id="sync-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Sync Only</SelectItem>
                <SelectItem value="hourly">Sync Every Hour</SelectItem>
                <SelectItem value="daily">Sync Daily</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {syncFrequency === 'manual' 
                ? "You'll manually sync when needed" 
                : `Data will automatically sync ${syncFrequency}`}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConnect}>
            Connect Sheet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
