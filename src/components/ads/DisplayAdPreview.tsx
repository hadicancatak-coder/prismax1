import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageIcon, Video, Mail, ChevronLeft, ChevronRight, Building, Check } from 'lucide-react';
import { useState } from 'react';
import { getProfileForLanguage } from '@/lib/adProfiles';

interface DisplayAdPreviewProps {
  businessName: string;
  longHeadline: string;
  shortHeadlines?: string[];
  descriptions: string[];
  ctaText: string;
  landingPage: string;
  language?: string;
}

export function DisplayAdPreview(props: DisplayAdPreviewProps) {
  const [combinationIndex, setCombinationIndex] = useState(0);
  const displayUrl = props.landingPage ? new URL(props.landingPage).hostname.replace('www.', '') : 'example.com';
  const profile = getProfileForLanguage(props.language || 'EN');
  const isRTL = props.language === 'AR';
  
  // Get active filtered arrays
  const activeShortHeadlines = props.shortHeadlines?.filter(h => h.trim()) || [];
  const activeDescriptions = props.descriptions.filter(d => d.trim());
  
  // Cycle through both headlines and descriptions
  const currentShortHeadline = activeShortHeadlines[combinationIndex % activeShortHeadlines.length] || props.longHeadline;
  const currentDescription = activeDescriptions[combinationIndex % activeDescriptions.length] || '';

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

        <TabsContent value="mobile" className="mt-4 flex justify-center">
          {/* Phone Frame Mockup */}
          <div className="relative w-[400px] h-[800px]">
            {/* Phone bezel */}
            <div className="absolute inset-0 rounded-[3rem] bg-gray-900 shadow-2xl p-3">
              {/* Screen */}
              <div className="h-full w-full rounded-[2.5rem] bg-white overflow-hidden relative">
                {/* Status bar */}
                <div className="h-8 bg-gray-50 flex items-center justify-between px-6 text-xs text-gray-600">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-3 border border-gray-400 rounded-sm" />
                    <div className="w-1 h-3 bg-gray-400 rounded-sm" />
                  </div>
                </div>
                
                  {/* Ad content - scrollable */}
                <div className="h-[calc(100%-2rem)] overflow-y-auto bg-white">
                  {/* Ad */}
                  <div className="border-b">
                    {/* Profile Header */}
                    <div className="flex items-center gap-2 p-3 border-b">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback>{profile.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold">{profile.name}</p>
                          {profile.verified && <Check className="h-3 w-3 text-blue-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">Sponsored</p>
                      </div>
                    </div>
                    <div className="h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">375x200 Image</p>
                      </div>
                    </div>
                    <div className={`p-3 space-y-2 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                      <p className="text-xs text-muted-foreground">{displayUrl}</p>
                      <h3 className="font-semibold text-sm line-clamp-2 text-gray-900">
                        {currentShortHeadline || 'Your headline here'}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {currentDescription || 'Your description here'}
                      </p>
                      {props.ctaText && (
                        <Button size="sm" className="w-full mt-2">
                          {props.ctaText}
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Fake content below ad */}
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  </div>
                </div>
                
                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-400 rounded-full" />
              </div>
            </div>
            
            {/* Power button */}
            <div className="absolute right-0 top-32 w-1 h-16 bg-gray-800 rounded-l" />
            {/* Volume buttons */}
            <div className="absolute left-0 top-28 w-1 h-8 bg-gray-800 rounded-r" />
            <div className="absolute left-0 top-40 w-1 h-12 bg-gray-800 rounded-r" />
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
              <Avatar className="w-16 h-16 shrink-0">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback>{profile.name[0]}</AvatarFallback>
              </Avatar>
              <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold truncate">{profile.name}</p>
                  {profile.verified && <Check className="h-3 w-3 text-blue-500" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{displayUrl}</p>
                <p className="font-semibold text-sm line-clamp-2 mt-1">{currentShortHeadline || props.longHeadline || 'Your ad headline'}</p>
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
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback>{profile.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-sm">{profile.name}</p>
                      {profile.verified && <Check className="h-3 w-3 text-blue-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Ad • {displayUrl}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Ad</Badge>
                </div>
                <h3 className={`font-semibold text-base ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                  {props.longHeadline || 'Your email subject'}
                </h3>
                <p className={`text-sm text-muted-foreground line-clamp-3 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                  {currentDescription || 'Ad description...'}
                </p>
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
              <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <p className="text-xs text-muted-foreground">{displayUrl}</p>
                <h3 className="font-semibold text-sm line-clamp-1">{currentShortHeadline || props.longHeadline || 'Headline'}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{currentDescription}</p>
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
            <div className={`p-3 space-y-2 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
              <p className="text-xs text-muted-foreground">{displayUrl}</p>
              <h3 className="font-semibold text-sm line-clamp-2">{currentShortHeadline || props.longHeadline || 'Headline'}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{currentDescription}</p>
              {props.ctaText && <Button size="sm" className="w-full">{props.ctaText}</Button>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
