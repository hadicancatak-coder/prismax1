import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Star, Trash2, Edit, Calendar, TrendingUp } from 'lucide-react';
import { AdElement } from '@/hooks/useAdElements';
import { useState } from 'react';
import { CreateElementDialog } from './CreateElementDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteAdElement, useUpdateAdElement } from '@/hooks/useAdElements';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ElementDetailDialogProps {
  element: AdElement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ElementDetailDialog({ element, open, onOpenChange }: ElementDetailDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteElement = useDeleteAdElement();
  const updateElement = useUpdateAdElement();
  const { toast } = useToast();

  if (!element) return null;

  const handleCopy = async () => {
    const text = typeof element.content === 'string' ? element.content : element.content.text || '';
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleToggleFavorite = () => {
    updateElement.mutate({ 
      id: element.id, 
      updates: { is_favorite: !element.is_favorite } 
    });
  };

  const handleDelete = () => {
    deleteElement.mutate(element.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        onOpenChange(false);
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'not_approved': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const content = typeof element.content === 'string' ? element.content : element.content.text || '';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {element.element_type.charAt(0).toUpperCase() + element.element_type.slice(1)}
              {element.is_favorite && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Content */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Content:</p>
              <p className="whitespace-pre-wrap">{content}</p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              {/* Entities */}
              {element.entity && element.entity.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Entities:</p>
                  <div className="flex flex-wrap gap-1">
                    {element.entity.map((e) => (
                      <Badge key={e} variant="secondary">{e}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {element.tags && element.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {element.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Google Status */}
            <div>
              <p className="text-sm font-medium mb-2">Google Status:</p>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(element.google_status)}>
                  {element.google_status}
                </Badge>
                {element.google_status_date && (
                  <span className="text-xs text-muted-foreground">
                    Updated {format(new Date(element.google_status_date), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              {element.google_status_notes && (
                <p className="text-sm text-muted-foreground mt-2">{element.google_status_notes}</p>
              )}
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Usage Count</p>
                  <p className="text-lg font-semibold">{element.use_count || 0}</p>
                </div>
              </div>
              {element.last_used_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Used</p>
                    <p className="text-sm font-medium">
                      {format(new Date(element.last_used_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFavorite}
                >
                  <Star className={`h-4 w-4 mr-2 ${element.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  {element.is_favorite ? 'Unfavorite' : 'Favorite'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateElementDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        elementType={element.element_type}
        initialContent={content}
        initialEntity={element.entity?.[0]}
        initialTags={element.tags?.join(', ')}
        elementId={element.id}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Element?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this element. {element.use_count > 0 && `It has been used ${element.use_count} times.`} This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
