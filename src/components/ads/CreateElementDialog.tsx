import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAdElement } from '@/hooks/useAdElements';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ENTITIES } from '@/lib/constants';

interface CreateElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elementType: 'headline' | 'description' | 'sitelink' | 'callout';
  initialContent?: string;
}

export function CreateElementDialog({ open, onOpenChange, elementType, initialContent }: CreateElementDialogProps) {
  const [content, setContent] = useState('');
  const [entity, setEntity] = useState('');
  const [tags, setTags] = useState('');
  const createElement = useCreateAdElement();
  
  useEffect(() => {
    if (open && initialContent) {
      setContent(initialContent);
    }
  }, [open, initialContent]);

  const handleSave = () => {
    createElement.mutate({
      element_type: elementType,
      content,
      entity: entity ? [entity] : [],
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      google_status: 'pending',
      is_favorite: false,
    }, {
      onSuccess: () => {
        setContent('');
        setEntity('');
        setTags('');
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {elementType.charAt(0).toUpperCase() + elementType.slice(1)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="content">Content</Label>
            {elementType === 'description' ? (
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter ${elementType} content...`}
                rows={3}
              />
            ) : (
              <Input
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter ${elementType} content...`}
              />
            )}
          </div>

          <div>
            <Label htmlFor="entity">Entity</Label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger>
                <SelectValue placeholder="Select entity..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {ENTITIES.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="promo, sale, new..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!content}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
