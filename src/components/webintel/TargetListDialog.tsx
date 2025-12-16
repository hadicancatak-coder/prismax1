import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandardSelect } from "@/components/ui/standard-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Globe, Youtube, Smartphone, Plus, Trash2, CheckCircle2, XCircle, Loader2, AlertCircle, Upload, Download } from "lucide-react";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { useGdnTargetLists, GdnTargetItem } from "@/hooks/useGdnTargetLists";
import { toast } from "sonner";

interface TargetListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list?: any;
  onSave: (data: any) => void;
}

export function TargetListDialog({ open, onOpenChange, list, onSave }: TargetListDialogProps) {
  const { data: entities = [] } = useSystemEntities();
  const { items, addItems, deleteItem, checkAdsTxt, getItemsByList } = useGdnTargetLists();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(list?.name || "");
  const [entity, setEntity] = useState(list?.entity || "");
  const [description, setDescription] = useState(list?.description || "");
  const [activeTab, setActiveTab] = useState("websites");
  const [bulkInput, setBulkInput] = useState("");
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

  const listItems = list ? getItemsByList(list.id) : [];
  const websiteItems = listItems.filter((i) => i.item_type === "website");
  const youtubeItems = listItems.filter((i) => i.item_type === "youtube");
  const appItems = listItems.filter((i) => i.item_type === "app");

  const handleSave = () => {
    if (!name.trim() || !entity) {
      toast.error("Name and Entity are required");
      return;
    }
    onSave({ name, entity, description });
  };

  const handleAddItems = async () => {
    if (!list || !bulkInput.trim()) return;

    const lines = bulkInput.split("\n").filter((l) => l.trim());
    const newItems = lines.map((line) => ({
      item_type: activeTab === "websites" ? "website" : activeTab === "youtube" ? "youtube" : "app",
      url: line.trim(),
    }));

    await addItems.mutateAsync({ listId: list.id, items: newItems });
    setBulkInput("");
  };

  const handleCheckAdsTxt = async (itemId: string) => {
    setCheckingIds((prev) => new Set(prev).add(itemId));
    try {
      await checkAdsTxt.mutateAsync(itemId);
    } finally {
      setCheckingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleCheckAllAdsTxt = async () => {
    const uncheckedWebsites = websiteItems.filter((i) => i.ads_txt_has_google === null && !i.ads_txt_error);
    for (const item of uncheckedWebsites) {
      await handleCheckAdsTxt(item.id);
    }
  };

  const handleExport = () => {
    const allItems = [...websiteItems, ...youtubeItems, ...appItems];
    const csv = [
      "type,url,name,ads_txt_status",
      ...allItems.map((item) => 
        `${item.item_type},"${item.url}","${item.name || ""}",${item.ads_txt_has_google === true ? "google_found" : item.ads_txt_has_google === false ? "no_google" : "not_checked"}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "target-list"}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !list) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").slice(1); // Skip header
      
      const itemsToAdd: Array<{ item_type: string; url: string; name?: string }> = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        const [type, url, itemName] = line.split(",").map((s) => s.replace(/"/g, "").trim());
        if (type && url && ["website", "youtube", "app"].includes(type)) {
          itemsToAdd.push({ item_type: type, url, name: itemName || undefined });
        }
      }

      if (itemsToAdd.length > 0) {
        await addItems.mutateAsync({ listId: list.id, items: itemsToAdd });
        toast.success(`Imported ${itemsToAdd.length} items`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const renderAdsTxtStatus = (item: GdnTargetItem) => {
    if (checkingIds.has(item.id)) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (item.ads_txt_error) {
      return (
        <div className="flex items-center gap-1 text-warning">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">{item.ads_txt_error}</span>
        </div>
      );
    }
    if (item.ads_txt_has_google === true) {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Google
        </Badge>
      );
    }
    if (item.ads_txt_has_google === false) {
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          <XCircle className="h-3 w-3 mr-1" />
          No Google
        </Badge>
      );
    }
    return <span className="text-xs text-muted-foreground">Not checked</span>;
  };

  const renderItemsTable = (tableItems: GdnTargetItem[], showAdsTxt: boolean) => (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>URL</TableHead>
            <TableHead>Name</TableHead>
            {showAdsTxt && <TableHead>ads.txt Status</TableHead>}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showAdsTxt ? 4 : 3} className="text-center text-muted-foreground py-8">
                No items added yet
              </TableCell>
            </TableRow>
          ) : (
            tableItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.url}</TableCell>
                <TableCell>{item.name || "-"}</TableCell>
                {showAdsTxt && <TableCell>{renderAdsTxtStatus(item)}</TableCell>}
                <TableCell>
                  <div className="flex items-center gap-1">
                    {showAdsTxt && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCheckAdsTxt(item.id)}
                        disabled={checkingIds.has(item.id)}
                      >
                        <Globe className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteItem.mutate(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const entityOptions = entities.map((e) => ({ value: e.name, label: e.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{list ? "Edit Target List" : "Create Target List"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>List Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Finance Publishers Q1"
              />
            </div>
            <div className="space-y-2">
              <Label>Entity *</Label>
              <StandardSelect
                value={entity}
                onChange={setEntity}
                placeholder="Select entity"
                options={entityOptions}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          {/* Items Section - Only show after list is created */}
          {list && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    <Globe className="h-3 w-3 mr-1" />
                    {websiteItems.length} Websites
                  </Badge>
                  <Badge variant="secondary">
                    <Youtube className="h-3 w-3 mr-1" />
                    {youtubeItems.length} YouTube
                  </Badge>
                  <Badge variant="secondary">
                    <Smartphone className="h-3 w-3 mr-1" />
                    {appItems.length} Apps
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" />
                    Import CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="websites" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Websites
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </TabsTrigger>
                  <TabsTrigger value="apps" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile Apps
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="websites" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Add website URLs. We'll check if they have Google in their ads.txt file.
                    </p>
                    {websiteItems.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleCheckAllAdsTxt}>
                        <Globe className="h-4 w-4 mr-1" />
                        Check All ads.txt
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder="Paste URLs here (one per line)&#10;example.com&#10;another-site.com"
                      rows={3}
                    />
                    <Button onClick={handleAddItems} disabled={!bulkInput.trim()} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Websites
                    </Button>
                  </div>

                  {renderItemsTable(websiteItems, true)}
                </TabsContent>

                <TabsContent value="youtube" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Add YouTube channel URLs or IDs for your GDN targeting.
                  </p>
                  
                  <div className="space-y-2">
                    <Textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder="Paste YouTube channel URLs (one per line)&#10;https://youtube.com/@channel&#10;UCxxxxx"
                      rows={3}
                    />
                    <Button onClick={handleAddItems} disabled={!bulkInput.trim()} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Channels
                    </Button>
                  </div>

                  {renderItemsTable(youtubeItems, false)}
                </TabsContent>

                <TabsContent value="apps" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Add mobile app store URLs or bundle IDs for your GDN targeting.
                  </p>
                  
                  <div className="space-y-2">
                    <Textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      placeholder="Paste app store URLs or bundle IDs (one per line)&#10;com.example.app&#10;https://play.google.com/store/apps/details?id=..."
                      rows={3}
                    />
                    <Button onClick={handleAddItems} disabled={!bulkInput.trim()} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Apps
                    </Button>
                  </div>

                  {renderItemsTable(appItems, false)}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {list ? "Save Changes" : "Create List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
