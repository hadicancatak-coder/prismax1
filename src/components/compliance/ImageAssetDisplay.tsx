interface ImageAssetDisplayProps {
  url: string;
}

export function ImageAssetDisplay({ url }: ImageAssetDisplayProps) {
  return (
    <div className="flex justify-center">
      <img
        src={url}
        alt="Asset preview"
        className="max-w-full h-auto rounded-md shadow-md max-h-[500px] object-contain"
      />
    </div>
  );
}
