import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

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

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Display Ad Preview</h3>
      
      <Tabs defaultValue="banner">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="banner">Banner (728x90)</TabsTrigger>
          <TabsTrigger value="sidebar">Sidebar (300x250)</TabsTrigger>
          <TabsTrigger value="native">Native</TabsTrigger>
        </TabsList>

        <TabsContent value="banner" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background" style={{ width: '728px', height: '90px' }}>
            <div className="flex h-full">
              <div className="w-24 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                728x90
              </div>
              <div className="flex-1 p-2 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">{businessName || 'Business Name'}</p>
                  <p className="text-xs text-foreground line-clamp-2">{shortHeadline || longHeadline || 'Your headline here'}</p>
                </div>
                {ctaText && (
                  <Button size="sm" className="ml-2 h-7 text-xs">
                    {ctaText}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sidebar" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background" style={{ width: '300px', height: '250px' }}>
            <div className="h-32 bg-muted flex items-center justify-center text-xs text-muted-foreground">
              300x250
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
                <Button size="sm" className="w-full h-8 text-xs">
                  {ctaText}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">{displayUrl}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="native" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background max-w-sm">
            <div className="h-48 bg-muted flex items-center justify-center text-sm text-muted-foreground">
              Image Placeholder
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground">{displayUrl}</p>
              <p className="text-lg font-semibold text-foreground">
                {shortHeadline || longHeadline || 'Your headline here'}
              </p>
              <p className="text-sm text-muted-foreground">
                {description || 'Your description here'}
              </p>
              {ctaText && (
                <Button className="w-full">
                  {ctaText}
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
