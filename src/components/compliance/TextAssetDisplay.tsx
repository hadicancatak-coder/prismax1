interface TextAssetDisplayProps {
  content: string;
}

export function TextAssetDisplay({ content }: TextAssetDisplayProps) {
  return (
    <div className="prose prose-sm max-w-none">
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {content}
      </div>
    </div>
  );
}
