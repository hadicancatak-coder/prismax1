interface VideoAssetDisplayProps {
  url: string;
}

export function VideoAssetDisplay({ url }: VideoAssetDisplayProps) {
  return (
    <div className="flex justify-center">
      <video
        src={url}
        controls
        className="max-w-full h-auto rounded-md shadow-md max-h-[500px]"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
