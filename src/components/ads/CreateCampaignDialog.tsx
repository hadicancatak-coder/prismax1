import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  onSuccess?: () => void;
}

export function CreateCampaignDialog({ open, onOpenChange, entityName, onSuccess }: CreateCampaignDialogProps) {
  const [name, setName] = useState('');
  const [languages, setLanguages] = useState<string[]>(['EN']);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleLanguage = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Campaign name is required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .insert({
          name: name.trim(),
          entity: entityName,
          languages: languages,
          status: 'draft',
        });

      if (error) throw error;

      toast({ title: "Campaign created successfully" });
      setName('');
      setLanguages(['EN']);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Failed to create campaign", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Campaign for {entityName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name *</Label>
            <Input
              id="campaign-name"
              placeholder="e.g., Q4 Brand Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Languages *</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lang-en"
                  checked={languages.includes('EN')}
                  onCheckedChange={() => toggleLanguage('EN')}
                />
                <label htmlFor="lang-en" className="text-sm font-medium cursor-pointer">
                  English
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lang-ar"
                  checked={languages.includes('AR')}
                  onCheckedChange={() => toggleLanguage('AR')}
                />
                <label htmlFor="lang-ar" className="text-sm font-medium cursor-pointer">
                  Arabic
                </label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
