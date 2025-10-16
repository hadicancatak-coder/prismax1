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
      
      <Tabs defaultValue="mobile-search">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mobile-search">Mobile Search</TabsTrigger>
          <TabsTrigger value="display">Display Network</TabsTrigger>
          <TabsTrigger value="responsive">Responsive</TabsTrigger>
        </TabsList>

        <TabsContent value="mobile-search" className="mt-4 flex justify-center">
          {/* iPhone-style mobile mockup */}
          <div className="relative" style={{ width: '375px', height: '667px' }}>
            <div className="absolute inset-0 bg-gray-900 rounded-[48px] p-3 shadow-2xl">
              <div className="bg-white rounded-[36px] h-full overflow-hidden flex flex-col">
                {/* Status bar */}
                <div className="h-11 flex items-center justify-between px-6 pt-2">
                  <span className="text-sm font-semibold">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-3 border border-gray-800 rounded-sm"></div>
                    <div className="w-1 h-3 bg-gray-800 rounded-sm"></div>
                  </div>
                </div>

                {/* Google Search Interface */}
                <div className="flex-1 overflow-y-auto">
                  {/* Google Logo */}
                  <div className="px-4 pt-2 pb-3">
                    <svg viewBox="0 0 272 92" className="h-8">
                      <text x="0" y="70" fontSize="80" fontWeight="bold" fill="#4285F4">G</text>
                      <text x="60" y="70" fontSize="80" fontWeight="bold" fill="#EA4335">o</text>
                      <text x="115" y="70" fontSize="80" fontWeight="bold" fill="#FBBC04">o</text>
                      <text x="170" y="70" fontSize="80" fontWeight="bold" fill="#4285F4">g</text>
                      <text x="220" y="70" fontSize="80" fontWeight="bold" fill="#34A853">l</text>
                      <text x="245" y="70" fontSize="80" fontWeight="bold" fill="#EA4335">e</text>
                    </svg>
                  </div>

                  {/* Search Bar */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-full shadow-sm bg-white">
                      <Search className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Search query</span>
                      <Menu className="w-5 h-5 text-gray-400 ml-auto" />
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-4 px-4 pb-3 border-b border-gray-200 overflow-x-auto">
                    <div className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-2 whitespace-nowrap">Search</div>
                    <div className="text-sm text-gray-600 pb-2 whitespace-nowrap">Display</div>
                    <div className="text-sm text-gray-600 pb-2 whitespace-nowrap">YouTube</div>
                    <div className="text-sm text-gray-600 pb-2 whitespace-nowrap">Discover</div>
                  </div>

                  {/* Sponsored Ad Card */}
                  <div className="mx-4 mt-3 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    {/* Sponsored Label */}
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-xs font-medium text-gray-900">Sponsored</span>
                    </div>

                    {/* Ad Content */}
                    <div className="px-3 pb-3">
                      <div className="flex gap-3">
                        {/* Brand Logo Placeholder */}
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>

                        {/* Ad Text */}
                        <div className="flex-1 min-w-0">
                          {/* Display URL */}
                          <div className="text-xs text-gray-600 mb-0.5">
                            {displayUrl}
                          </div>

                          {/* Headline */}
                          <div className="text-blue-600 text-sm font-medium leading-snug mb-1 line-clamp-2">
                            {headline}
                          </div>

                          {/* Description */}
                          <div className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                            {description || 'Your description here'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Organic results placeholder */}
                  <div className="px-4 mt-4 space-y-4">
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
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

        <TabsContent value="responsive" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background max-w-sm">
            <div className="h-48 bg-muted flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground" />
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground">{displayUrl}</p>
              <p className="text-lg font-semibold text-foreground">
                {headline}
              </p>
              <p className="text-sm text-muted-foreground">
                {description || 'Your description here'}
              </p>
              {ctaText && (
                <div className="w-full px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium text-center">
                  {ctaText}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
