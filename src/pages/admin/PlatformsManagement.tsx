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
import { useUtmPlatforms, useCreatePlatform, useUpdatePlatform, useTogglePlatform, type UtmPlatform } from "@/hooks/useUtmPlatforms";

export default function PlatformsManagement() {
  const { data: platforms, isLoading } = useUtmPlatforms();
  const createPlatform = useCreatePlatform();
  const updatePlatform = useUpdatePlatform();
  const togglePlatform = useTogglePlatform();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<UtmPlatform | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
  });

  const resetForm = () => {
    setFormData({ name: "" });
  };

  const handleAdd = async () => {
    if (!formData.name) return;

    await createPlatform.mutateAsync({
      name: formData.name,
      is_active: true,
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!editingPlatform || !formData.name) return;

    await updatePlatform.mutateAsync({
      id: editingPlatform.id,
      name: formData.name,
    });

    setIsEditDialogOpen(false);
    setEditingPlatform(null);
    resetForm();
  };

  const handleToggle = async (platform: UtmPlatform) => {
    await togglePlatform.mutateAsync({
      id: platform.id,
      is_active: !platform.is_active,
    });
  };

  const openEditDialog = (platform: UtmPlatform) => {
    setEditingPlatform(platform);
    setFormData({ name: platform.name });
    setIsEditDialogOpen(true);
  };

  const filteredPlatforms = platforms?.filter(platform =>
    platform.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-muted-foreground">Loading platforms...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search platforms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Platform</DialogTitle>
              <DialogDescription>
                Add a new UTM platform to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Platform Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Facebook"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAdd}
                disabled={!formData.name || createPlatform.isPending}
              >
                Create Platform
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Platforms Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlatforms?.map((platform) => (
              <TableRow key={platform.id}>
                <TableCell className="font-medium">{platform.name}</TableCell>
                <TableCell>
                  <Badge variant={platform.is_active ? 'default' : 'secondary'}>
                    {platform.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(platform)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(platform)}
                    >
                      {platform.is_active ? (
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
            <DialogTitle>Edit Platform</DialogTitle>
            <DialogDescription>
              Update platform details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Platform Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingPlatform(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleEdit}
              disabled={!formData.name || updatePlatform.isPending}
            >
              Update Platform
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
