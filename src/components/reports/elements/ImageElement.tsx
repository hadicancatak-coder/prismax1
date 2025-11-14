import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import type { ImageElementData } from "@/types/report";

interface ImageElementProps {
  data: ImageElementData;
  onChange: (data: ImageElementData) => void;
  isActive: boolean;
}

export function ImageElement({ data, onChange, isActive }: ImageElementProps) {
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onChange({
        ...data,
        url: base64,
        alt: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    
    onChange({
      ...data,
      url: urlInput.trim(),
    });
    setUrlInput('');
  };

  const handleCaptionChange = (caption: string) => {
    onChange({ ...data, caption });
  };

  const handleAltChange = (alt: string) => {
    onChange({ ...data, alt });
  };

  // If no image is set, show upload interface
  if (!data.url) {
    return (
      <div className="border-2 border-dashed rounded-lg p-8">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="h-4 w-4 mr-2" />
              From URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Click to upload an image or drag and drop
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUrlSubmit();
                  }}
                />
                <Button onClick={handleUrlSubmit}>Add</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // If image is set, show the image with caption
  return (
    <div className="space-y-4">
      <div className="relative group">
        <img
          src={data.url}
          alt={data.alt || 'Report image'}
          className="w-full h-auto rounded-lg"
          style={{ maxHeight: '600px', objectFit: 'contain' }}
        />
        
        {/* Change Image Button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChange({ ...data, url: '' })}
          >
            Change Image
          </Button>
        </div>
      </div>

      {/* Caption and Alt Text */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="caption" className="text-xs text-muted-foreground">
            Caption (optional)
          </Label>
          <Input
            id="caption"
            placeholder="Add a caption..."
            value={data.caption || ''}
            onChange={(e) => handleCaptionChange(e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="altText" className="text-xs text-muted-foreground">
            Alt Text (for accessibility)
          </Label>
          <Input
            id="altText"
            placeholder="Describe the image..."
            value={data.alt || ''}
            onChange={(e) => handleAltChange(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>

      {data.caption && (
        <p className="text-sm text-center text-muted-foreground italic">
          {data.caption}
        </p>
      )}
    </div>
  );
}
