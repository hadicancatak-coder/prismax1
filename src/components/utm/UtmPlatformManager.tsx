import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useUtmPlatforms, useCreatePlatform, useUpdatePlatform, useDeletePlatform } from "@/hooks/useUtmPlatforms";
import { checkPlatformDependencies, formatDependencyMessage } from "@/lib/selectorDependencyCheck";
import { toast } from "sonner";

export function UtmPlatformManager() {
  const { data: platforms = [], isLoading } = useUtmPlatforms();
  const createPlatform = useCreatePlatform();
  const updatePlatform = useUpdatePlatform();
  const deletePlatform = useDeletePlatform();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<any>(null);
  const [platformForm, setPlatformForm] = useState({ name: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState<any>(null);

  const handleOpenDialog = (platform: any = null) => {
    if (platform) {
      setEditingPlatform(platform);
      setPlatformForm({ name: platform.name });
    } else {
      setEditingPlatform(null);
      setPlatformForm({ name: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSavePlatform = () => {
    if (!platformForm.name.trim()) {
      toast.error("Platform name is required");
      return;
    }

    if (editingPlatform) {
      updatePlatform.mutate(
        { id: editingPlatform.id, name: platformForm.name },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingPlatform(null);
            setPlatformForm({ name: "" });
          }
        }
      );
    } else {
      createPlatform.mutate(
        { name: platformForm.name },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setPlatformForm({ name: "" });
          }
        }
      );
    }
  };

  const handleDeleteClick = async (platform: any) => {
    const dependencies = await checkPlatformDependencies(platform.name);
    if (!dependencies.canDelete) {
      toast.error("Cannot delete platform", {
        description: formatDependencyMessage(dependencies.dependencies),
        duration: 5000
      });
      return;
    }
    setPlatformToDelete(platform);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (platformToDelete) {
      deletePlatform.mutate(platformToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setPlatformToDelete(null);
        }
      });
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading platforms...</div>;
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">UTM Platforms</h3>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platforms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No platforms configured yet
                  </TableCell>
                </TableRow>
              ) : (
                platforms.map((platform) => (
                  <TableRow key={platform.id}>
                    <TableCell className="font-medium">{platform.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(platform)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(platform)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlatform ? "Edit Platform" : "Add Platform"}</DialogTitle>
            <DialogDescription>
              {editingPlatform ? "Update platform name" : "Add a new UTM platform"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                placeholder="e.g., Google, Meta, TikTok"
                value={platformForm.name}
                onChange={(e) => setPlatformForm({ name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlatform}>
              {editingPlatform ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Platform?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{platformToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
