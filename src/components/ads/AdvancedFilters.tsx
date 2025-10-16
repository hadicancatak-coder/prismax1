import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export function AdvancedFilters({ onFiltersChange }: AdvancedFiltersProps) {
  const [entity, setEntity] = useState('');
  const [googleStatus, setGoogleStatus] = useState('');
  const [open, setOpen] = useState(false);

  const activeFilters = [
    entity && { key: 'entity', label: entity },
    googleStatus && { key: 'googleStatus', label: googleStatus },
  ].filter(Boolean);

  const applyFilters = () => {
    onFiltersChange({
      entity: entity || undefined,
      googleStatus: googleStatus || undefined,
    });
    setOpen(false);
  };

  const clearFilters = () => {
    setEntity('');
    setGoogleStatus('');
    onFiltersChange({});
  };

  return (
    <div className="flex items-center gap-2">
      {activeFilters.length > 0 && (
        <div className="flex gap-1">
          {activeFilters.map((filter: any) => (
            <Badge key={filter.key} variant="secondary">
              {filter.label}
            </Badge>
          ))}
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Advanced Filters</h4>

            <div>
              <Label>Entity</Label>
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FBK">FBK</SelectItem>
                  <SelectItem value="FBC">FBC</SelectItem>
                  <SelectItem value="CFI">CFI</SelectItem>
                  <SelectItem value="LCFX">LCFX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Google Status</Label>
              <Select value={googleStatus} onValueChange={setGoogleStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Clear
              </Button>
              <Button onClick={applyFilters} className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
