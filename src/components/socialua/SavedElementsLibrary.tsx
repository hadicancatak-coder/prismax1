import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

interface SavedElementsLibraryProps {
  platform: string;
  onElementSelect: (element: any) => void;
}

export function SavedElementsLibrary({ platform, onElementSelect }: SavedElementsLibraryProps) {
  const [elements, setElements] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchElements();
  }, [platform]);

  const fetchElements = async () => {
    const { data } = await supabase
      .from("ad_elements")
      .select("*")
      .eq("platform", "social")
      .order("created_at", { ascending: false });

    setElements(data || []);
  };

  const filteredElements = elements.filter((el) =>
    el.content?.text?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedElements = {
    headline: filteredElements.filter((el) => el.element_type === "headline"),
    primary_text: filteredElements.filter((el) => el.element_type === "primary_text"),
    description: filteredElements.filter((el) => el.element_type === "description"),
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Saved Elements</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search elements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="headline">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="headline">Headlines</TabsTrigger>
            <TabsTrigger value="primary_text">Primary Text</TabsTrigger>
            <TabsTrigger value="description">Descriptions</TabsTrigger>
          </TabsList>

          {Object.entries(groupedElements).map(([type, items]) => (
            <TabsContent key={type} value={type} className="space-y-2 mt-4">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved {type.replace("_", " ")}s
                </p>
              ) : (
                items.map((element) => (
                  <Card
                    key={element.id}
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onElementSelect(element)}
                  >
                    <p className="text-sm mb-2">{element.content?.text}</p>
                    <div className="flex flex-wrap gap-1">
                      {element.entity?.map((e: string) => (
                        <Badge key={e} variant="outline" className="text-xs">
                          {e}
                        </Badge>
                      ))}
                      <Badge variant="secondary" className="text-xs">
                        {element.language}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Card>
  );
}
