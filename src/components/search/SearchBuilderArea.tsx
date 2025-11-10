import { SearchHierarchyPanel } from "./SearchHierarchyPanel";

interface SearchBuilderAreaProps {
  onAdCreated?: (adId: string) => void;
}

export function SearchBuilderArea({ onAdCreated }: SearchBuilderAreaProps) {
  return <SearchHierarchyPanel onAdCreated={onAdCreated} />;
}
