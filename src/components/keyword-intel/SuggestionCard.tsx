import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, Plus, ChevronDown } from 'lucide-react';
import { CLUSTER_TAXONOMY } from '@/lib/keywordEngine';

interface LeakageSuggestion {
  id: string;
  run_id: string;
  suggestion_type: string;
  extracted_phrase: string;
  evidence_terms: string[];
  evidence_cost: number;
  evidence_clicks: number;
  proposed_dict_name?: string;
  proposed_canonical?: string;
  proposed_alias?: string;
  status: string;
}

interface SuggestionCardProps {
  suggestion: LeakageSuggestion;
  onAccept: (suggestion: LeakageSuggestion, overrideCluster?: string) => void;
  onReject: (id: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: SuggestionCardProps) {
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newClusterName, setNewClusterName] = useState('');

  // Determine default cluster recommendation
  const getDefaultCluster = () => {
    if (suggestion.extracted_phrase.includes('.com') || 
        suggestion.extracted_phrase.includes('capital') ||
        suggestion.extracted_phrase.includes('etoro') ||
        suggestion.extracted_phrase.includes('plus500')) {
      return 'Competitors';
    }
    return 'Brand - CFI';
  };

  const handleAccept = () => {
    const cluster = isCreatingNew && newClusterName.trim() 
      ? newClusterName.trim() 
      : selectedCluster || getDefaultCluster();
    onAccept(suggestion, cluster);
  };

  const handleClusterChange = (value: string) => {
    if (value === '__create_new__') {
      setIsCreatingNew(true);
      setSelectedCluster('');
    } else {
      setIsCreatingNew(false);
      setSelectedCluster(value);
    }
  };

  return (
    <div className="p-md bg-elevated rounded-lg border border-border">
      <div className="flex items-start justify-between gap-md">
        <div className="flex-1 space-y-sm">
          {/* Phrase Header */}
          <p className="text-heading-sm font-semibold">"{suggestion.extracted_phrase}"</p>
          
          {/* Stats */}
          <p className="text-body-sm text-muted-foreground">
            Found in {suggestion.evidence_terms.length} keywords spending 
            <span className="text-foreground font-medium mx-xs">${suggestion.evidence_cost.toFixed(0)}</span>
            with {suggestion.evidence_clicks} clicks
          </p>

          {/* Cluster Selector */}
          <div className="mt-sm p-sm bg-subtle rounded border border-border">
            <div className="flex items-center gap-sm flex-wrap">
              <Label className="text-body-sm font-medium whitespace-nowrap">Classify as:</Label>
              
              {!isCreatingNew ? (
                <Select
                  value={selectedCluster || getDefaultCluster()}
                  onValueChange={handleClusterChange}
                >
                  <SelectTrigger className="w-[240px] bg-elevated">
                    <SelectValue placeholder="Select cluster..." />
                  </SelectTrigger>
                  <SelectContent className="bg-elevated border-border z-50 max-h-[300px]">
                    {CLUSTER_TAXONOMY.map((cluster) => (
                      <SelectItem key={cluster} value={cluster}>
                        {cluster}
                      </SelectItem>
                    ))}
                    <SelectItem value="__create_new__" className="text-primary font-medium">
                      <span className="flex items-center gap-xs">
                        <Plus className="h-3 w-3" /> Create New Cluster
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-xs">
                  <Input
                    value={newClusterName}
                    onChange={(e) => setNewClusterName(e.target.value)}
                    placeholder="Enter new cluster name..."
                    className="w-[200px] bg-elevated"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewClusterName('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-metadata text-muted-foreground mt-xs">
              The engine will learn this classification for future analysis.
            </p>
          </div>

          {/* Example Terms */}
          <div>
            <p className="text-metadata text-muted-foreground">Example terms:</p>
            <div className="flex flex-wrap gap-xs mt-xs">
              {suggestion.evidence_terms.slice(0, 5).map((term, i) => (
                <Badge key={i} variant="outline" className="text-metadata">{term}</Badge>
              ))}
              {suggestion.evidence_terms.length > 5 && (
                <Badge variant="secondary" className="text-metadata">
                  +{suggestion.evidence_terms.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-xs">
          <Button 
            size="sm"
            onClick={handleAccept}
            disabled={isAccepting || (isCreatingNew && !newClusterName.trim())}
          >
            <Check className="h-4 w-4 mr-xs" /> Accept
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onReject(suggestion.id)}
            disabled={isRejecting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
