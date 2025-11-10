import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Star } from 'lucide-react';

interface SearchAdPreviewProps {
  headlines: string[];
  descriptions: string[];
  landingPage: string;
  businessName?: string;
  sitelinks?: ({ text: string; url: string } | string)[];
  callouts?: string[];
}

const parseUrlSafely = (url: string | null | undefined): { hostname: string; pathname: string } => {
  if (!url || !url.trim()) {
    return { hostname: 'example.com', pathname: '' };
  }
  
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const parsedUrl = new URL(urlWithProtocol);
    return {
      hostname: parsedUrl.hostname.replace('www.', ''),
      pathname: parsedUrl.pathname
    };
  } catch (error) {
    console.warn('Invalid URL provided:', url);
    return { hostname: url.split('/')[0] || 'example.com', pathname: '' };
  }
};

export function SearchAdPreview(props: SearchAdPreviewProps) {
  const { hostname: displayUrl, pathname: pathUrl } = parseUrlSafely(props.landingPage);
  
  // Get first 3 headlines and 2 descriptions (Google Ads limit)
  const activeHeadlines = props.headlines.filter(h => h.trim()).slice(0, 3);
  const activeDescriptions = props.descriptions.filter(d => d.trim()).slice(0, 2);
  const activeSitelinks = (props.sitelinks || [])
    .filter(s => typeof s === 'string' ? s.trim() : s.text.trim())
    .slice(0, 4);
  const activeCallouts = (props.callouts || []).filter(c => c.trim()).slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Desktop Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">Desktop</Badge>
          <span className="text-xs text-muted-foreground">Google Search Results</span>
        </div>
        <Card className="p-4 bg-background border">
          <div className="space-y-1">
            {/* Ad badge */}
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs font-normal">Ad</Badge>
            </div>
            
            {/* URL */}
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{displayUrl}</span>
              <span className="text-muted-foreground">{pathUrl}</span>
            </div>
            
            {/* Headline (3 headlines joined with " | ") */}
            <h3 className="text-xl text-primary hover:underline cursor-pointer font-normal">
              {activeHeadlines.length > 0 
                ? activeHeadlines.join(' | ')
                : 'Headline 1 | Headline 2 | Headline 3'}
            </h3>
            
            {/* Descriptions */}
            <div className="text-sm text-foreground space-y-1">
              {activeDescriptions.map((desc, idx) => (
                <p key={idx}>{desc}</p>
              ))}
              {activeDescriptions.length === 0 && (
                <>
                  <p>Your first description will appear here</p>
                  <p>Your second description will appear here</p>
                </>
              )}
            </div>

            {/* Sitelinks */}
            {activeSitelinks.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-3">
                {activeSitelinks.map((link, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="text-primary hover:underline cursor-pointer truncate">
                      {typeof link === 'string' ? link : link.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Callouts */}
            {activeCallouts.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {activeCallouts.map((callout, idx) => (
                  <span key={idx} className="text-xs text-muted-foreground">
                    {callout}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Mobile Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">Mobile</Badge>
          <span className="text-xs text-muted-foreground">Google Mobile Search</span>
        </div>
        <Card className="p-3 bg-background border max-w-[380px]">
          <div className="space-y-1">
            {/* Ad badge */}
            <Badge variant="outline" className="text-xs font-normal mb-1">Ad</Badge>
            
            {/* URL */}
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {displayUrl}
            </div>
            
            {/* Headline - mobile shows shorter version */}
            <h3 className="text-lg text-primary font-normal line-clamp-2">
              {activeHeadlines.length > 0 
                ? activeHeadlines.slice(0, 2).join(' | ')
                : 'Headline 1 | Headline 2'}
            </h3>
            
            {/* Description - only first one on mobile */}
            <p className="text-sm text-foreground line-clamp-2">
              {activeDescriptions[0] || 'Your description will appear here'}
            </p>

            {/* Sitelinks - 2 on mobile */}
            {activeSitelinks.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-2">
                {activeSitelinks.slice(0, 2).map((link, idx) => (
                  <p key={idx} className="text-xs text-primary hover:underline cursor-pointer truncate">
                    {typeof link === 'string' ? link : link.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}