import { useState } from "react";
import { Plus, Pencil, Power, PowerOff, History } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAllEntities, useCreateEntity, useUpdateEntity, useToggleEntity, useEntityChangeLog, type SystemEntity } from "@/hooks/useSystemEntities";
import { format } from "date-fns";

export default function EntitiesManagement() {
  const { data: entities, isLoading } = useAllEntities();
  const { data: changeLogs } = useEntityChangeLog();
  const createEntity = useCreateEntity();
  const updateEntity = useUpdateEntity();
  const toggleEntity = useToggleEntity();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<SystemEntity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    emoji: "",
    display_order: 0,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      emoji: "",
      display_order: entities?.length || 0,
    });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.code) return;

    await createEntity.mutateAsync({
      name: formData.name,
      code: formData.code,
      emoji: formData.emoji || null,
      is_active: true,
      display_order: formData.display_order,
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!editingEntity || !formData.name || !formData.code) return;

    await updateEntity.mutateAsync({
      id: editingEntity.id,
      name: formData.name,
      code: formData.code,
      emoji: formData.emoji || null,
      display_order: formData.display_order,
    });

    setIsEditDialogOpen(false);
    setEditingEntity(null);
    resetForm();
  };

  const handleToggle = async (entity: SystemEntity) => {
    await toggleEntity.mutateAsync({
      id: entity.id,
      is_active: !entity.is_active,
    });
  };

  const openEditDialog = (entity: SystemEntity) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      code: entity.code,
      emoji: entity.emoji || "",
      display_order: entity.display_order,
    });
    setIsEditDialogOpen(true);
  };

  const generateCodeFromName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '_');
  };

  const filteredEntities = entities?.filter(entity =>
    entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entity.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-muted-foreground">Loading entities...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                Audit Log
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Entity Change Log</SheetTitle>
                <SheetDescription>
                  Track all changes made to entities
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {changeLogs?.map((log: any) => (
                  <div key={log.id} className="border-b border-border pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={
                        log.action === 'created' ? 'default' :
                        log.action === 'updated' ? 'secondary' : 'destructive'
                      }>
                        {log.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.changed_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {log.new_value?.name || log.old_value?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {log.changed_by_profile?.name || 'System'}
                    </p>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Entity</DialogTitle>
                <DialogDescription>
                  Create a new entity/country for the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        code: generateCodeFromName(e.target.value),
                      });
                    }}
                    placeholder="e.g., United Arab Emirates"
                  />
                </div>
                <div>
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., uae"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-generated from name, but can be edited
                  </p>
                </div>
                <div>
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    placeholder="🇦🇪"
                    maxLength={4}
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
                  disabled={!formData.name || !formData.code || createEntity.isPending}
                >
                  Create Entity
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Entities Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="w-16">Emoji</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntities?.map((entity) => (
              <TableRow key={entity.id}>
                <TableCell className="text-muted-foreground">
                  {entity.display_order}
                </TableCell>
                <TableCell className="text-2xl">
                  {entity.emoji || '📍'}
                </TableCell>
                <TableCell className="font-medium">{entity.name}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {entity.code}
                </TableCell>
                <TableCell>
                  <Badge variant={entity.is_active ? 'default' : 'secondary'}>
                    {entity.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(entity)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(entity)}
                    >
                      {entity.is_active ? (
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
            <DialogTitle>Edit Entity</DialogTitle>
            <DialogDescription>
              Update entity details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-code">Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-emoji">Emoji</Label>
              <Input
                id="edit-emoji"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                maxLength={4}
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
              setEditingEntity(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleEdit}
              disabled={!formData.name || !formData.code || updateEntity.isPending}
            >
              Update Entity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
