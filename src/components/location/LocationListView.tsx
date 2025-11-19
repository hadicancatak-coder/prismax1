import { useState } from "react";
import { MediaLocation, getLocationCategory } from "@/hooks/useMediaLocations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SimpleMultiSelect } from "@/components/utm/SimpleMultiSelect";
import { Download, Eye, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface LocationListViewProps {
  locations: MediaLocation[];
  onView: (location: MediaLocation) => void;
  onEdit: (location: MediaLocation) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export function LocationListView({ locations, onView, onEdit, onDelete, isAdmin }: LocationListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "score" | "city" | "type" | "price">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredLocations = locations
    .filter(loc => {
      const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           loc.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (loc.agency && loc.agency.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      if (sortBy === "city") comparison = a.city.localeCompare(b.city);
      if (sortBy === "type") comparison = a.type.localeCompare(b.type);
      if (sortBy === "score") comparison = (a.manual_score || 0) - (b.manual_score || 0);
      if (sortBy === "price") comparison = (a.price_per_month || 0) - (b.price_per_month || 0);
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const exportToCSV = () => {
    const headers = ["Name", "City", "Type", "Category", "Agency", "Price/Month", "Est. Daily Traffic", "Manual Score", "Latitude", "Longitude", "Notes"];
    const rows = filteredLocations.map(loc => {
      const category = getLocationCategory(loc.type);
      return [
        loc.name,
        loc.city,
        loc.type,
        category || "",
        loc.agency || "",
        loc.price_per_month || "",
        loc.est_daily_traffic || "",
        loc.manual_score || "",
        loc.latitude,
        loc.longitude,
        (loc.notes || "").replace(/,/g, ";"),
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `media-locations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const toggleSort = (column: "name" | "score" | "city" | "type" | "price") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Search locations, cities, or agencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md"
        />

        <div className="ml-auto">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("city")}>
                City {sortBy === "city" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("type")}>
                Type {sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("price")}>
                Price/Month {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Daily Traffic</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("score")}>
                Score {sortBy === "score" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No locations found
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((location) => {
                const category = getLocationCategory(location.type);
                return (
                <TableRow key={location.id} className="hover:bg-muted/50 transition-smooth">
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.city}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{location.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {category ? (
                      <span className="text-muted-foreground">{category}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {location.agency || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {location.price_per_month ? (
                      `AED ${location.price_per_month.toLocaleString()}`
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {location.est_daily_traffic ? (
                      location.est_daily_traffic.toLocaleString()
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {location.manual_score ? (
                      <Badge>{location.manual_score}/10</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onView(location)} className="transition-smooth hover:scale-105">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => onEdit(location)} className="transition-smooth hover:scale-105">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteId(location.id)} className="transition-smooth hover:scale-105">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this location? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
