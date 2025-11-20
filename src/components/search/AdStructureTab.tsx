import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, List, Search, Plus } from "lucide-react";
import { SearchHierarchyPanel } from "./SearchHierarchyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdStructureTabProps {
  adType: "search" | "display";
  onEditAd: (ad: any, adGroup: any, campaign: any, entity: string) => void;
  onCreateAd: (adGroup: any, campaign: any, entity: string) => void;
}

export function AdStructureTab({ adType, onEditAd, onCreateAd }: AdStructureTabProps) {
  const [viewMode, setViewMode] = useState<"tree" | "cards">("tree");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with controls */}
      <div className="p-md border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns, ad groups, or ads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-xs border border-border rounded-md p-1">
            <Button
              size="sm"
              variant={viewMode === "tree" ? "default" : "ghost"}
              onClick={() => setViewMode("tree")}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "cards" ? "default" : "ghost"}
              onClick={() => setViewMode("cards")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {viewMode === "tree" ? (
          <SearchHierarchyPanel
            adType={adType}
            onEditAd={onEditAd}
            onCreateAd={onCreateAd}
          />
        ) : (
          <div className="p-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
              <Card className="hover-lift cursor-pointer transition-smooth">
                <CardHeader className="pb-sm">
                  <CardTitle className="text-heading-sm flex items-center justify-between">
                    <span>Campaign Name</span>
                    <Badge variant="outline" className="text-metadata">
                      5 ads
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-xs">
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-muted-foreground">Ad Groups:</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className="bg-success/15 text-success">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* More campaign cards will be rendered here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
