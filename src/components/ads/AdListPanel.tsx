import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdListPanelProps {
  ads: any[];
  selectedAdId: string | null;
  onSelectAd: (ad: any) => void;
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onBulkAction: (action: "approve" | "reject" | "export" | "delete", ids: string[]) => void;
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdListPanel({
  ads,
  selectedAdId,
  onSelectAd,
  selectedIds,
  onToggleSelection,
  onBulkAction,
}: AdListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter ads
  const filteredAds = ads.filter((ad) => {
    const matchesSearch =
      searchQuery === "" ||
      ad.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.campaign?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.entity?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ad.approval_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const allSelected = filteredAds.length > 0 && filteredAds.every((ad) => selectedIds.includes(ad.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      filteredAds.forEach((ad) => {
        if (selectedIds.includes(ad.id)) {
          onToggleSelection(ad.id);
        }
      });
    } else {
      // Select all
      filteredAds.forEach((ad) => {
        if (!selectedIds.includes(ad.id)) {
          onToggleSelection(ad.id);
        }
      });
    }
  };

  return (
    <div className="h-full flex flex-col border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ads..."
            className="pl-9"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={statusFilter === filter.value ? "default" : "outline"}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Select All Checkbox */}
        {filteredAds.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              className={cn(someSelected && "data-[state=checked]:bg-primary/50")}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.length > 0
                ? `${selectedIds.length} selected`
                : "Select all"}
            </span>
          </div>
        )}
      </div>

      {/* Ad List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredAds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No ads found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filteredAds.map((ad) => (
              <div
                key={ad.id}
                className={cn(
                  "group relative p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                  selectedAdId === ad.id && "bg-primary/10 border-primary",
                  selectedIds.includes(ad.id) && "ring-2 ring-primary/20"
                )}
                onClick={() => onSelectAd(ad)}
              >
                {/* Checkbox */}
                <div className="absolute top-3 left-3">
                  <Checkbox
                    checked={selectedIds.includes(ad.id)}
                    onCheckedChange={(checked) => {
                      onToggleSelection(ad.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Content */}
                <div className="ml-8">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{ad.name}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {ad.entity && (
                          <Badge variant="outline" className="text-xs">
                            {ad.entity}
                          </Badge>
                        )}
                        {ad.ad_type && (
                          <Badge variant="secondary" className="text-xs">
                            {ad.ad_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform",
                        selectedAdId === ad.id && "text-primary"
                      )}
                    />
                  </div>

                  {/* Campaign & Ad Group */}
                  <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                    {ad.campaign && (
                      <p className="truncate">
                        <span className="font-medium">Campaign:</span> {ad.campaign}
                      </p>
                    )}
                    {ad.ad_group && (
                      <p className="truncate">
                        <span className="font-medium">Ad Group:</span> {ad.ad_group}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="mt-2">
                    <Badge className={cn("text-xs", getStatusColor(ad.approval_status || "draft"))}>
                      {ad.approval_status || "draft"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          {filteredAds.length} of {ads.length} ads
        </p>
      </div>
    </div>
  );
}
