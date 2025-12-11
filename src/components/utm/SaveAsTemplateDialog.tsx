import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateUtmTemplate } from '@/hooks/useUtmTemplates';

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateData: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
    entity?: string;
    team?: string;
  };
}

export function SaveAsTemplateDialog({ open, onOpenChange, templateData }: SaveAsTemplateDialogProps) {
  const [name, setName] = useState('');
  const createTemplate = useCreateUtmTemplate();

  const handleSave = () => {
    if (!name.trim()) return;

    createTemplate.mutate({
      name: name.trim(),
      utm_source: templateData.utm_source,
      utm_medium: templateData.utm_medium,
      utm_campaign: templateData.utm_campaign,
      utm_content: templateData.utm_content,
      utm_term: templateData.utm_term,
      entity: templateData.entity,
      team: templateData.team,
      is_public: false,
    }, {
      onSuccess: () => {
        setName('');
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-md">
          <div className="space-y-sm">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Facebook AO Template"
            />
          </div>
          
          <div className="text-body-sm text-muted-foreground">
            <p>Template will save:</p>
            <ul className="list-disc list-inside mt-sm space-y-xs">
              <li>UTM Source: {templateData.utm_source}</li>
              <li>UTM Medium: {templateData.utm_medium}</li>
              <li>UTM Campaign: {templateData.utm_campaign}</li>
              {templateData.utm_content && <li>UTM Content: {templateData.utm_content}</li>}
              {templateData.utm_term && <li>UTM Term: {templateData.utm_term}</li>}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
