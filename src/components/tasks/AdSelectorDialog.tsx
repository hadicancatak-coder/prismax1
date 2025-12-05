import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Search, Megaphone } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAds: (ads: any[]) => void;
  excludeIds?: string[];
}

export function AdSelectorDialog({ open, onOpenChange, onSelectAds, excludeIds = [] }: AdSelectorDialogProps) {
  const { user } = useAuth();
  const [ads, setAds] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAds();
    }
  }, [open, user?.id]);

  const fetchAds = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter out excluded ads
    const filteredAds = (data || []).filter((ad) => !excludeIds.includes(ad.id));
    setAds(filteredAds);
    setLoading(false);
  };

  const filteredAds = ads.filter((ad) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      ad.headline?.toLowerCase().includes(searchLower) ||
      ad.description?.toLowerCase().includes(searchLower) ||
      ad.ad_type?.toLowerCase().includes(searchLower)
    );
  });

  const handleToggle = (adId: string) => {
    setSelectedIds((prev) =>
      prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId]
    );
  };

  const handleConfirm = () => {
    const selectedAds = ads.filter((ad) => selectedIds.includes(ad.id));
    onSelectAds(selectedAds);
    setSelectedIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl max-h-[80vh]"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Select Ads to Attach
          </DialogTitle>
          <DialogDescription>
            Search and select ads to attach to this task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ads by headline, description, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading ads...</div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No ads found matching your search" : "No ads available"}
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredAds.map((ad) => (
                  <Card
                    key={ad.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedIds.includes(ad.id) ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => handleToggle(ad.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.includes(ad.id)}
                        onCheckedChange={() => handleToggle(ad.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {ad.ad_type || "PPC"}
                          </Badge>
                          <Badge
                            variant={
                              ad.status === "approved"
                                ? "default"
                                : ad.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {ad.status}
                          </Badge>
                        </div>
                        <h5 className="font-medium text-sm">{ad.headline || "Untitled Ad"}</h5>
                        {ad.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{ad.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{ad.language || "EN"}</span>
                          {ad.entity && ad.entity.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{ad.entity.join(", ")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.length === 0}>
            Attach {selectedIds.length} Ad{selectedIds.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
