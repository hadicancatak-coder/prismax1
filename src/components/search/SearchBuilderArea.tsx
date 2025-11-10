import { Card, CardContent } from "@/components/ui/card";
import { SearchCampaignForm } from "./SearchCampaignForm";
import { SearchAdGroupForm } from "./SearchAdGroupForm";
import { SearchAdGroupAdsView } from "./SearchAdGroupAdsView";
import SearchAdEditor from "./SearchAdEditor";

interface SearchBuilderAreaProps {
  selectedEntity: string | null;
  selectedCampaign: any | null;
  selectedAdGroup: any | null;
  selectedAd: any | null;
  onCampaignCreated: (campaignId: string) => void;
  onAdGroupCreated: (adGroupId: string) => void;
  onAdCreated: (adId?: string) => void;
  onAdSelected: (ad: any) => void;
  onBack: () => void;
}

export function SearchBuilderArea({
  selectedEntity,
  selectedCampaign,
  selectedAdGroup,
  selectedAd,
  onCampaignCreated,
  onAdGroupCreated,
  onAdCreated,
  onAdSelected,
  onBack
}: SearchBuilderAreaProps) {
  // No entity selected - welcome view
  if (!selectedEntity) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Welcome to Search Planner</h2>
            <p className="text-muted-foreground">
              Select an entity from the tree on the left to start building your search campaigns.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ad selected - show ad editor
  if (selectedAd) {
    return (
      <SearchAdEditor
        ad={selectedAd}
        adGroup={selectedAdGroup}
        campaign={selectedCampaign}
        entity={selectedEntity}
        onSave={onAdCreated}
        onCancel={onBack}
      />
    );
  }

  // Ad group selected - show ads list and creation
  if (selectedAdGroup) {
    return (
      <SearchAdGroupAdsView
        adGroup={selectedAdGroup}
        campaign={selectedCampaign}
        entity={selectedEntity}
        onAdSelected={onAdSelected}
        onAdCreated={onAdCreated}
      />
    );
  }

  // Campaign selected - show ad groups and creation form
  if (selectedCampaign) {
    return (
      <SearchAdGroupForm
        campaign={selectedCampaign}
        entity={selectedEntity}
        onAdGroupCreated={onAdGroupCreated}
      />
    );
  }

  // Only entity selected - show campaign creation form
  return (
    <SearchCampaignForm
      entity={selectedEntity}
      onCampaignCreated={onCampaignCreated}
    />
  );
}
