import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Edit, Trash2, Star } from 'lucide-react';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { useUpdateAdElement, useDeleteAdElement, AdElement } from '@/hooks/useAdElements';
import { useToast } from '@/hooks/use-toast';
import { UpdateGoogleStatusDialog } from './UpdateGoogleStatusDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ENTITIES } from '@/lib/constants';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ElementCardProps {
  element: AdElement;
}

export function ElementCard({ element }: ElementCardProps) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editingEntity, setEditingEntity] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<string[]>(element.entity || []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const updateElement = useUpdateAdElement();
  const deleteElement = useDeleteAdElement();
  const { toast } = useToast();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = typeof element.content === 'string' ? element.content : element.content?.text || JSON.stringify(element.content);
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateElement.mutate({ id: element.id, updates: { is_favorite: !element.is_favorite } });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteElement.mutate(element.id);
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    const text = typeof element.content === 'string' 
      ? element.content 
      : element.content?.text || JSON.stringify(element.content);
    setEditedContent(text);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    updateElement.mutate(
      { 
        id: element.id, 
        updates: { content: { text: editedContent } } 
      },
      {
        onSuccess: () => {
          toast({ title: "Updated" });
          setIsEditing(false);
        }
      }
    );
  };

  const handleSaveEntity = () => {
    updateElement.mutate(
      {
        id: element.id,
        updates: { entity: selectedEntities }
      },
      {
        onSuccess: () => {
          toast({ title: "Entity updated" });
          setEditingEntity(false);
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'limited': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const content = typeof element.content === 'string' ? element.content : element.content?.text || JSON.stringify(element.content);

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleEdit}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <RichTextEditor
                  value={editedContent}
                  onChange={(value) => {
                    const plainText = value.replace(/<[^>]*>/g, '');
                    const maxLength = element.element_type === 'headline' ? 30 : element.element_type === 'description' ? 90 : 1000;
                    setEditedContent(plainText.slice(0, maxLength));
                  }}
                  className="text-sm"
                  minHeight="80px"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {editedContent.length} / {element.element_type === 'headline' ? '30' : element.element_type === 'description' ? '90' : '1000'} characters
                  </span>
                  {editedContent.length > (element.element_type === 'headline' ? 30 : element.element_type === 'description' ? 90 : 1000) && (
                    <span className="text-destructive">Character limit exceeded!</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}>Save</Button>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium line-clamp-2">{content}</p>
                <div className="flex flex-wrap gap-1 mt-2 items-center">
                  {(element as any).language && (
                    <Badge 
                      variant={(element as any).language === 'AR' ? 'secondary' : 'default'} 
                      className="text-xs"
                      title="Auto-detected language"
                    >
                      {(element as any).language === 'AR' ? '🇸🇦 Arabic' : '🇬🇧 English'}
                    </Badge>
                  )}
                  {(element as any).platform && (
                    <Badge variant="outline" className="text-xs">
                      {(element as any).platform.toUpperCase()}
                    </Badge>
                  )}
                  {editingEntity ? (
                    <Popover open={editingEntity} onOpenChange={setEditingEntity}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                          Edit Entities ({selectedEntities.length})
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm mb-2">Select Entities</h4>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {ENTITIES.map((ent) => (
                              <div key={ent} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={selectedEntities.includes(ent)}
                                  onCheckedChange={(checked) => {
                                    setSelectedEntities(prev =>
                                      checked ? [...prev, ent] : prev.filter(e => e !== ent)
                                    );
                                  }}
                                />
                                <label className="text-sm">{ent}</label>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleSaveEntity(); }}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditingEntity(false); setSelectedEntities(element.entity || []); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <>
                      {element.entity && element.entity.length > 0 && element.entity.map((ent) => (
                        <Badge key={ent} variant="outline" className="text-xs">
                          {ent}
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setEditingEntity(true); }}
                        className="h-6 px-2 text-xs"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          {!isEditing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleFavorite}
              className="ml-2 shrink-0"
            >
              <Star className={`w-4 h-4 ${element.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
          )}
        </div>

        {!isEditing && (
          <>
            <div className="flex items-center justify-between mb-3">
              <Badge 
                className={getStatusColor(element.google_status)}
                onClick={(e) => { e.stopPropagation(); setShowStatusDialog(true); }}
                role="button"
              >
                {element.google_status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Used {element.use_count} times
              </span>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1">
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
                <Edit className="w-3 h-3" />
              </Button>
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="z-[9999]" onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this element?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </Card>

      <UpdateGoogleStatusDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        element={element}
      />
    </>
  );
}
