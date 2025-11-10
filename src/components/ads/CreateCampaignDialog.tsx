import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [objective, setObjective] = useState('');
  const [budgetMonthly, setBudgetMonthly] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
          objective: objective || null,
          budget_monthly: budgetMonthly ? parseFloat(budgetMonthly) : null,
          status: 'draft',
        });

      if (error) throw error;

      toast({ title: "Campaign created successfully" });
      setName('');
      setObjective('');
      setBudgetMonthly('');
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
            <Label htmlFor="objective">Objective</Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger>
                <SelectValue placeholder="Select objective" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                <SelectItem value="lead_generation">Lead Generation</SelectItem>
                <SelectItem value="conversions">Conversions</SelectItem>
                <SelectItem value="traffic">Website Traffic</SelectItem>
                <SelectItem value="app_promotion">App Promotion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Monthly Budget (Optional)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="e.g., 5000"
              value={budgetMonthly}
              onChange={(e) => setBudgetMonthly(e.target.value)}
            />
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
