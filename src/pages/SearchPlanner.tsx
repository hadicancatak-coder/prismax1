import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { AccountStructureTree } from "@/components/ads/AccountStructureTree";
import { SearchBuilderArea } from "@/components/search/SearchBuilderArea";
import { supabase } from "@/integrations/supabase/client";

export default function SearchPlanner() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [selectedAdGroup, setSelectedAdGroup] = useState<any>(null);
  const [selectedAd, setSelectedAd] = useState<any>(null);

  // Parse node selection to determine what's selected
  const handleNodeSelect = async (node: any) => {
    setSelectedNodeId(node.id);

    // Reset selections based on node type
    if (node.type === 'entity') {
      setSelectedEntity(node.name);
      setSelectedCampaign(null);
      setSelectedAdGroup(null);
      setSelectedAd(null);
    } else if (node.type === 'campaign') {
      // Fetch campaign details
      const campaignId = node.id.replace('campaign-', '');
      const { data } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      
      setSelectedEntity(data?.entity || null);
      setSelectedCampaign(data);
      setSelectedAdGroup(null);
      setSelectedAd(null);
    } else if (node.type === 'adgroup') {
      // Fetch ad group and campaign details
      const adGroupId = node.id.replace('adgroup-', '');
      const { data: adGroupData } = await supabase
        .from('ad_groups')
        .select('*, ad_campaigns(*)')
        .eq('id', adGroupId)
        .single();
      
      setSelectedEntity(adGroupData?.ad_campaigns?.entity || null);
      setSelectedCampaign(adGroupData?.ad_campaigns);
      setSelectedAdGroup(adGroupData);
      setSelectedAd(null);
    } else if (node.type === 'ad') {
      // Fetch ad, ad group, and campaign details
      const adId = node.id.replace('ad-', '');
      const { data: adData } = await supabase
        .from('ads')
        .select('*, ad_groups(*, ad_campaigns(*))')
        .eq('id', adId)
        .single();
      
      setSelectedEntity(adData?.ad_groups?.ad_campaigns?.entity || null);
      setSelectedCampaign(adData?.ad_groups?.ad_campaigns);
      setSelectedAdGroup(adData?.ad_groups);
      setSelectedAd(adData);
    }
  };

  const handleCampaignCreated = () => {
    // Refresh will happen via react-query
  };

  const handleAdGroupCreated = () => {
    // Refresh will happen via react-query
  };

  const handleAdCreated = () => {
    // Go back to ad group view
    setSelectedAd(null);
  };

  const handleAdSelected = (ad: any) => {
    setSelectedAd(ad);
  };

  const handleBack = () => {
    if (selectedAd) {
      setSelectedAd(null);
    } else if (selectedAdGroup) {
      setSelectedAdGroup(null);
    } else if (selectedCampaign) {
      setSelectedCampaign(null);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <AccountStructureTree
            selectedNodeId={selectedNodeId}
            onSelectNode={handleNodeSelect}
            onCreateCampaign={(entityName) => {
              setSelectedEntity(entityName);
              setSelectedCampaign(null);
              setSelectedAdGroup(null);
              setSelectedAd(null);
            }}
            onCreateAdGroup={(campaignId, campaignName) => {
              // Will be handled by tree selection
            }}
            onCreateAd={(adGroupId, adGroupName) => {
              // Will be handled by tree selection
            }}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={70}>
          <SearchBuilderArea
            selectedEntity={selectedEntity}
            selectedCampaign={selectedCampaign}
            selectedAdGroup={selectedAdGroup}
            selectedAd={selectedAd}
            onCampaignCreated={handleCampaignCreated}
            onAdGroupCreated={handleAdGroupCreated}
            onAdCreated={handleAdCreated}
            onAdSelected={handleAdSelected}
            onBack={handleBack}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
