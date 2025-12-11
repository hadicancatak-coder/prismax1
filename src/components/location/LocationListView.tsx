import { useState } from "react";
import { MediaLocation, getLocationCategory } from "@/hooks/useMediaLocations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [sortBy, setSortBy] = useState<"name" | "city" | "type">("name");
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
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const exportToCSV = () => {
    const headers = ["Name", "City", "Type", "Category", "Agency", "Latitude", "Longitude", "Notes"];
    const rows = filteredLocations.map(loc => {
      const category = getLocationCategory(loc.type);
      return [
        loc.name,
        loc.city,
        loc.type,
        category || "",
        loc.agency || "",
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

  const toggleSort = (column: "name" | "city" | "type") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-md">
      <div className="flex gap-md items-center">
        <Input
          placeholder="Search locations, cities, or agencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md"
        />

        <div className="ml-auto">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-sm" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("name")}>
                  Name <ArrowUpDown className="ml-sm h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("city")}>
                  City <ArrowUpDown className="ml-sm h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("type")}>
                  Type <ArrowUpDown className="ml-sm h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-lg">
                  No locations found
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((location) => {
                const category = getLocationCategory(location.type);
                return (
                  <TableRow key={location.id} className="cursor-pointer hover:bg-accent" onClick={() => onView(location)}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{location.city}</TableCell>
                    <TableCell>{location.type}</TableCell>
                    <TableCell>
                      {category && (
                        <Badge variant="outline" className="text-metadata">{category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{location.agency || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-xs justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(location);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(location);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(location.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
            <AlertDialogTitle>Delete Location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this location. This action cannot be undone.
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
