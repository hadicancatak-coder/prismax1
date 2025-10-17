import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Menu, Image as ImageIcon } from 'lucide-react';

interface DisplayAdPreviewProps {
  businessName: string;
  longHeadline: string;
  shortHeadline: string;
  description: string;
  ctaText: string;
  landingPage: string;
}

export function DisplayAdPreview({
  businessName,
  longHeadline,
  shortHeadline,
  description,
  ctaText,
  landingPage,
}: DisplayAdPreviewProps) {
  const displayUrl = landingPage ? new URL(landingPage).hostname : 'example.com';
  const headline = longHeadline || shortHeadline || 'Your headline here';

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Display Ad Preview</h3>
      
      <Tabs defaultValue="leaderboard">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="display">Banner Ads</TabsTrigger>
          <TabsTrigger value="mobile">Mobile Banner</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Leaderboard Banner (728x90)</p>
            <div className="border rounded-lg overflow-hidden bg-background" style={{ width: '728px', height: '90px' }}>
              <div className="flex h-full items-center p-3 gap-3">
                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground line-clamp-1">
                    {headline}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {description || 'Your description here'}
                  </p>
                  <p className="text-xs text-muted-foreground">{displayUrl}</p>
                </div>
                {ctaText && (
                  <div className="px-6 py-2 bg-primary text-primary-foreground rounded text-sm font-medium whitespace-nowrap">
                    {ctaText}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="display" className="mt-4">
          <div className="space-y-4">
            {/* Banner 728x90 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Banner (728x90)</p>
              <div className="border rounded-lg overflow-hidden bg-background inline-block" style={{ width: '728px', height: '90px' }}>
                <div className="flex h-full">
                  <div className="w-24 bg-muted flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1 p-2 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">{businessName || 'Business Name'}</p>
                      <p className="text-xs text-foreground line-clamp-2">{shortHeadline || longHeadline || 'Your headline here'}</p>
                    </div>
                    {ctaText && (
                      <div className="ml-2 px-4 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium">
                        {ctaText}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Medium Rectangle 300x250 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Medium Rectangle (300x250)</p>
              <div className="border rounded-lg overflow-hidden bg-background inline-block" style={{ width: '300px', height: '250px' }}>
                <div className="h-32 bg-muted flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">{businessName || 'Business Name'}</p>
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {shortHeadline || longHeadline || 'Your headline here'}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {description || 'Your description here'}
                  </p>
                  {ctaText && (
                    <div className="w-full px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-medium text-center">
                      {ctaText}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{displayUrl}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mobile" className="mt-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Mobile Banner (320x100)</p>
            <div className="border rounded-lg overflow-hidden bg-background inline-block" style={{ width: '320px', height: '100px' }}>
              <div className="flex h-full items-center p-2 gap-2">
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground line-clamp-2">
                    {shortHeadline || headline}
                  </p>
                </div>
                {ctaText && (
                  <div className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium whitespace-nowrap">
                    {ctaText}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
