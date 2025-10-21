import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageIcon, Video, Mail, ChevronLeft, ChevronRight, Building } from 'lucide-react';
import { useState } from 'react';

interface DisplayAdPreviewProps {
  businessName: string;
  longHeadline: string;
  shortHeadline?: string;
  descriptions: string[];
  ctaText: string;
  landingPage: string;
}

export function DisplayAdPreview(props: DisplayAdPreviewProps) {
  const [combinationIndex, setCombinationIndex] = useState(0);
  const displayUrl = props.landingPage ? new URL(props.landingPage).hostname.replace('www.', '') : 'example.com';
  const activeDescription = props.descriptions.filter(d => d.trim())[combinationIndex % props.descriptions.filter(d => d.trim()).length] || props.descriptions[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCombinationIndex(Math.max(0, combinationIndex - 1))} disabled={combinationIndex === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Combination {combinationIndex + 1}</span>
          <Button variant="ghost" size="icon" onClick={() => setCombinationIndex(combinationIndex + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Preview different combinations</p>
      </div>

      <Tabs defaultValue="mobile">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="gmail">Gmail</TabsTrigger>
          <TabsTrigger value="banner">Banner</TabsTrigger>
          <TabsTrigger value="sidebar">Sidebar</TabsTrigger>
        </TabsList>

        <TabsContent value="mobile" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background max-w-[375px] mx-auto">
            <div className="h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">375x200 Image</p>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground">{displayUrl}</p>
              <h3 className="font-semibold text-sm line-clamp-2">{props.longHeadline || 'Your headline here'}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{activeDescription || 'Your description here'}</p>
              {props.ctaText && <Button size="sm" className="w-full mt-2">{props.ctaText}</Button>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="youtube" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background max-w-[640px] mx-auto">
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">1280x720 Video</p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded text-xs text-white">Skip Ad</div>
            </div>
            <div className="p-4 bg-muted/50 flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center shrink-0">
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{displayUrl}</p>
                <p className="font-semibold text-sm line-clamp-2">{props.longHeadline || 'Your ad headline'}</p>
              </div>
              {props.ctaText && <Button size="sm" variant="secondary">{props.ctaText}</Button>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gmail" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background max-w-[600px] mx-auto">
            <div className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center shrink-0">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{props.businessName || 'Advertiser'}</p>
                    <p className="text-xs text-muted-foreground">Ad • {displayUrl}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Ad</Badge>
                </div>
                <h3 className="font-semibold text-base">{props.longHeadline || 'Your email subject'}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{activeDescription || 'Ad description...'}</p>
                <div className="flex items-center gap-2 pt-2">
                  {props.ctaText && <Button size="sm">{props.ctaText}</Button>}
                  <Button size="sm" variant="ghost">Learn More</Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="banner" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background max-w-[728px] h-[90px] mx-auto flex items-center">
            <div className="w-[120px] h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1 px-4 py-2 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{displayUrl}</p>
                <h3 className="font-semibold text-sm line-clamp-1">{props.longHeadline || 'Headline'}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{activeDescription}</p>
              </div>
              {props.ctaText && <Button size="sm">{props.ctaText}</Button>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sidebar" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background w-[300px] h-[250px] mx-auto">
            <div className="h-[120px] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">300x120</p>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground">{displayUrl}</p>
              <h3 className="font-semibold text-sm line-clamp-2">{props.longHeadline || 'Headline'}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{activeDescription}</p>
              {props.ctaText && <Button size="sm" className="w-full">{props.ctaText}</Button>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
