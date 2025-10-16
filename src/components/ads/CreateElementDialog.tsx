import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAdElement, useUpdateAdElement } from '@/hooks/useAdElements';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ENTITIES } from '@/lib/constants';

interface CreateElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elementType: 'headline' | 'description' | 'sitelink' | 'callout' | 'business_name' | 'long_headline' | 'cta';
  initialContent?: string;
  initialEntity?: string;
  initialTags?: string;
  elementId?: string;
}

export function CreateElementDialog({ 
  open, 
  onOpenChange, 
  elementType, 
  initialContent,
  initialEntity,
  initialTags,
  elementId 
}: CreateElementDialogProps) {
  const [content, setContent] = useState('');
  const [entity, setEntity] = useState('');
  const [tags, setTags] = useState('');
  const createElement = useCreateAdElement();
  const updateElement = useUpdateAdElement();
  
  useEffect(() => {
    if (open) {
      setContent(initialContent || '');
      setEntity(initialEntity || '');
      setTags(initialTags || '');
    } else if (!open) {
      setContent('');
      setEntity('');
      setTags('');
    }
  }, [open, initialContent, initialEntity, initialTags]);

  const getCharacterLimit = () => {
    switch (elementType) {
      case 'business_name': return 25;
      case 'headline': return 30;
      case 'long_headline': return 90;
      case 'description': return 90;
      case 'sitelink': return 25;
      case 'callout': return 25;
      case 'cta': return 25;
      default: return 100;
    }
  };

  const getElementLabel = () => {
    switch (elementType) {
      case 'business_name': return 'Business Name';
      case 'long_headline': return 'Long Headline';
      case 'cta': return 'CTA';
      default: return elementType.charAt(0).toUpperCase() + elementType.slice(1);
    }
  };

  const handleSave = () => {
    if (elementId) {
      updateElement.mutate({
        id: elementId,
        updates: {
          content,
          entity: entity ? [entity] : [],
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
        },
      }, {
        onSuccess: () => {
          onOpenChange(false);
        }
      });
    } else {
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
    }
  };

  const charLimit = getCharacterLimit();
  const isOverLimit = content.length > charLimit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{elementId ? 'Edit' : 'Add'} {getElementLabel()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="content">Content</Label>
              <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                {content.length}/{charLimit}
              </span>
            </div>
            {elementType === 'description' || elementType === 'long_headline' ? (
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter ${getElementLabel().toLowerCase()} content...`}
                rows={3}
                maxLength={charLimit}
              />
            ) : (
              <Input
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter ${getElementLabel().toLowerCase()} content...`}
                maxLength={charLimit}
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
          <Button onClick={handleSave} disabled={!content || isOverLimit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
