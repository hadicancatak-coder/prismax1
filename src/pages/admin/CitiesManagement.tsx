import { useState } from "react";
import { Plus, Pencil, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllCities, useCreateCity, useUpdateCity, useToggleCity, type SeminarCity } from "@/hooks/useSystemCities";

export default function CitiesManagement() {
  const { data: cities, isLoading } = useAllCities();
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const toggleCity = useToggleCity();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<SeminarCity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    display_order: 0,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      country: "",
      display_order: cities?.length || 0,
    });
  };

  const handleAdd = async () => {
    if (!formData.name) return;

    await createCity.mutateAsync({
      name: formData.name,
      country: formData.country || null,
      is_active: true,
      display_order: formData.display_order,
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!editingCity || !formData.name) return;

    await updateCity.mutateAsync({
      id: editingCity.id,
      name: formData.name,
      country: formData.country || null,
      display_order: formData.display_order,
    });

    setIsEditDialogOpen(false);
    setEditingCity(null);
    resetForm();
  };

  const handleToggle = async (city: SeminarCity) => {
    await toggleCity.mutateAsync({
      id: city.id,
      is_active: !city.is_active,
    });
  };

  const openEditDialog = (city: SeminarCity) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      country: city.country || "",
      display_order: city.display_order,
    });
    setIsEditDialogOpen(true);
  };

  const filteredCities = cities?.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (city.country?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  if (isLoading) {
    return <div className="text-muted-foreground">Loading cities...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add City
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New City</DialogTitle>
              <DialogDescription>
                Add a new seminar city to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">City Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Dubai"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="e.g., UAE"
                />
              </div>
              <div>
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAdd}
                disabled={!formData.name || createCity.isPending}
              >
                Create City
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cities Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCities?.map((city) => (
              <TableRow key={city.id}>
                <TableCell className="text-muted-foreground">
                  {city.display_order}
                </TableCell>
                <TableCell className="font-medium">{city.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {city.country || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={city.is_active ? 'default' : 'secondary'}>
                    {city.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(city)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(city)}
                    >
                      {city.is_active ? (
                        <PowerOff className="h-4 w-4 text-destructive" />
                      ) : (
                        <Power className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit City</DialogTitle>
            <DialogDescription>
              Update city details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">City Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-order">Display Order</Label>
              <Input
                id="edit-order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingCity(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleEdit}
              disabled={!formData.name || updateCity.isPending}
            >
              Update City
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
