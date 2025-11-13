import { RichTextEditor } from "@/components/editor/RichTextEditor";
import type { TextElementData } from "@/types/report";

interface TextElementProps {
  data: TextElementData;
  onChange: (data: TextElementData) => void;
  isActive: boolean;
}

export function TextElement({ data, onChange, isActive }: TextElementProps) {
  const handleContentChange = (content: string) => {
    onChange({ content });
  };

  return (
    <div>
      <RichTextEditor
        value={data.content}
        onChange={handleContentChange}
        placeholder="Start typing..."
        minHeight="200px"
        autoFocus={isActive}
      />
    </div>
  );
}
