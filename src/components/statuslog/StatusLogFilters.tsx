import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { EnhancedMultiSelect } from "@/components/utm/EnhancedMultiSelect";
import { StatusLogFilters as Filters } from "@/lib/statusLogService";

interface StatusLogFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function StatusLogFilters({ filters, onFiltersChange }: StatusLogFiltersProps) {
  const { data: entities = [] } = useSystemEntities();
  const { data: platforms = [] } = useUtmPlatforms();
  const { data: campaigns = [] } = useUtmCampaigns();

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search logs..."
          value={filters.search || ""}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Entity</Label>
          <EnhancedMultiSelect
            options={entities.map(e => ({ value: e.name, label: e.name }))}
            selected={filters.entity || []}
            onChange={(entity) => onFiltersChange({ ...filters, entity })}
            placeholder="All entities"
          />
        </div>

        <div className="space-y-2">
          <Label>Platform</Label>
          <Select
            value={filters.platform || ""}
            onValueChange={(platform) => onFiltersChange({ ...filters, platform: platform || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p.id} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Campaign</Label>
          <Select
            value={filters.campaign_name || ""}
            onValueChange={(campaign_name) => onFiltersChange({ ...filters, campaign_name: campaign_name || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status || ""}
            onValueChange={(status) => onFiltersChange({ ...filters, status: status || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Label className="text-sm text-muted-foreground">Log Type:</Label>
        <div className="flex gap-2 flex-wrap">
          {['issue', 'blocker', 'plan', 'update', 'note'].map((type) => (
            <button
              key={type}
              onClick={() => onFiltersChange({
                ...filters,
                log_type: filters.log_type === type ? undefined : type
              })}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filters.log_type === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
