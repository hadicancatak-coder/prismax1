import { useState } from "react";
import { MediaLocation } from "@/hooks/useMediaLocations";
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
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [agencyFilter, setAgencyFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState<"name" | "score" | "city" | "type" | "price">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const cities = Array.from(new Set(locations.map(l => l.city))).sort();
  const types = Array.from(new Set(locations.map(l => l.type))).sort();
  const agencies = Array.from(new Set(locations.map(l => l.agency).filter(Boolean))).sort();
  const prices = locations.map(l => l.price_per_month || 0);
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 100000);

  const filteredLocations = locations
    .filter(loc => {
      const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           loc.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = cityFilter === "all" || loc.city === cityFilter;
      const matchesType = typeFilter === "all" || loc.type === typeFilter;
      const matchesAgency = agencyFilter.length === 0 || (loc.agency && agencyFilter.includes(loc.agency));
      const matchesPrice = !loc.price_per_month || 
                          (loc.price_per_month >= priceRange[0] && loc.price_per_month <= priceRange[1]);
      return matchesSearch && matchesCity && matchesType && matchesAgency && matchesPrice;
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
    const headers = ["Name", "City", "Type", "Score", "Agency", "Price per Month", "Latitude", "Longitude", "Notes"];
    const rows = filteredLocations.map(loc => [
      loc.name,
      loc.city,
      loc.type,
      loc.manual_score || "",
      loc.agency || "",
      loc.price_per_month || "",
      loc.latitude,
      loc.longitude,
      loc.notes || "",
    ]);

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
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />

        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <SimpleMultiSelect
          options={agencies.map(a => ({ value: a as string, label: a as string }))}
          selected={agencyFilter}
          onChange={setAgencyFilter}
          placeholder="Filter by agency"
        />

        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            className="w-24"
            placeholder="Min AED"
          />
          <span>-</span>
          <Input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-24"
            placeholder="Max AED"
          />
        </div>

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
              <TableHead className="cursor-pointer" onClick={() => toggleSort("score")}>
                Score {sortBy === "score" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Agency</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("price")}>
                Price/Month {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No locations found
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.city}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{location.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {location.manual_score ? (
                      <Badge>{location.manual_score}/10</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {location.agency || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {location.price_per_month ? (
                      `AED ${location.price_per_month.toLocaleString()}`
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onView(location)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => onEdit(location)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteId(location.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
