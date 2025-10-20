import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Trash2, Star } from 'lucide-react';
import { useUpdateAdElement, useDeleteAdElement, AdElement } from '@/hooks/useAdElements';
import { useToast } from '@/hooks/use-toast';
import { UpdateGoogleStatusDialog } from './UpdateGoogleStatusDialog';

interface ElementCardProps {
  element: AdElement;
}

export function ElementCard({ element }: ElementCardProps) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const updateElement = useUpdateAdElement();
  const deleteElement = useDeleteAdElement();
  const { toast } = useToast();

  const handleCopy = () => {
    const text = typeof element.content === 'string' ? element.content : JSON.stringify(element.content);
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleToggleFavorite = () => {
    updateElement.mutate({ id: element.id, updates: { is_favorite: !element.is_favorite } });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this element?')) {
      deleteElement.mutate(element.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'limited': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const content = typeof element.content === 'string' ? element.content : JSON.stringify(element.content);

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm font-medium line-clamp-2">{content}</p>
            {element.entity && element.entity.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {element.entity.map((ent) => (
                  <Badge key={ent} variant="outline" className="text-xs">
                    {ent}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleFavorite}
            className="ml-2"
          >
            <Star className={`w-4 h-4 ${element.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <Badge 
            className={getStatusColor(element.google_status)}
            onClick={() => setShowStatusDialog(true)}
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
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </Card>

      <UpdateGoogleStatusDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        element={element}
      />
    </>
  );
}
