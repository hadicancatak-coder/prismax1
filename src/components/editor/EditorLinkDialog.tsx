import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditorLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (url: string) => void;
  initialUrl?: string;
}

export function EditorLinkDialog({
  open,
  onOpenChange,
  onSave,
  initialUrl = '',
}: EditorLinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
    }
  }, [open, initialUrl]);

  const handleSave = () => {
    onSave(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
          <DialogDescription>
            Enter the URL for the link
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Insert Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
