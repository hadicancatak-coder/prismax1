import { useState } from "react";
import { SearchHierarchyPanel } from "./SearchHierarchyPanel";
import SearchAdEditor from "./SearchAdEditor";

interface SearchBuilderAreaProps {
  onAdCreated?: (adId: string) => void;
}

type ViewState = 'hierarchy' | 'ad-editor';

interface EditorContext {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
}

export function SearchBuilderArea({ onAdCreated }: SearchBuilderAreaProps) {
  const [view, setView] = useState<ViewState>('hierarchy');
  const [editorContext, setEditorContext] = useState<EditorContext | null>(null);

  if (view === 'ad-editor' && editorContext) {
    return (
      <SearchAdEditor
        ad={editorContext.ad}
        adGroup={editorContext.adGroup}
        campaign={editorContext.campaign}
        entity={editorContext.entity}
        onSave={(adId) => {
          setView('hierarchy');
          onAdCreated?.(adId || '');
        }}
        onCancel={() => setView('hierarchy')}
      />
    );
  }

  return (
    <SearchHierarchyPanel
      onEditAd={(ad, adGroup, campaign, entity) => {
        setEditorContext({ ad, adGroup, campaign, entity });
        setView('ad-editor');
      }}
      onCreateAd={(adGroup, campaign, entity) => {
        setEditorContext({ ad: {}, adGroup, campaign, entity });
        setView('ad-editor');
      }}
    />
  );
}
