import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Star, Copy } from "lucide-react";

export function AdLibraryTab() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with search and filters */}
      <div className="p-md border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saved elements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-xs">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-xs mt-sm">
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-smooth">
            All
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-smooth">
            Headlines
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-smooth">
            Descriptions
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-smooth">
            Sitelinks
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-smooth">
            Callouts
          </Badge>
        </div>
      </div>

      {/* Grid of saved elements */}
      <div className="flex-1 overflow-auto p-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          <Card className="hover-lift cursor-pointer transition-smooth group">
            <CardContent className="p-md">
              <div className="flex items-start justify-between mb-sm">
                <Badge className="text-metadata">Headline</Badge>
                <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-smooth">
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Star className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-body font-medium mb-xs">Best Forex Trading in UAE</p>
              <div className="flex items-center justify-between text-metadata text-muted-foreground">
                <span>Used 12 times</span>
                <span>30 chars</span>
              </div>
            </CardContent>
          </Card>

          {/* More element cards will be rendered here */}
        </div>
      </div>
    </div>
  );
}
