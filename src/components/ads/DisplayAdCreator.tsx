import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ElementQuickInsert } from './ElementQuickInsert';

interface DisplayAdCreatorProps {
  businessName: string;
  setBusinessName: (value: string) => void;
  longHeadline: string;
  setLongHeadline: (value: string) => void;
  shortHeadlines: string[];
  setShortHeadlines: (value: string[]) => void;
  descriptions: string[];
  setDescriptions: (value: string[]) => void;
  ctaText: string;
  setCtaText: (value: string) => void;
  landingPage: string;
  setLandingPage: (value: string) => void;
  adEntity?: string;
}

const CTA_OPTIONS = [
  'Learn More', 'Shop Now', 'Sign Up', 'Get Started', 'Contact Us',
  'Download', 'Book Now', 'Subscribe', 'Apply Now', 'Get Quote'
];

export function DisplayAdCreator({
  businessName, setBusinessName,
  longHeadline, setLongHeadline,
  shortHeadlines, setShortHeadlines,
  descriptions, setDescriptions,
  ctaText, setCtaText,
  landingPage, setLandingPage,
  adEntity,
}: DisplayAdCreatorProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="business-name">Business Name (25 chars max)</Label>
        <Input
          id="business-name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value.slice(0, 25))}
          placeholder="Your Business Name"
          maxLength={25}
        />
        <p className="text-xs text-muted-foreground mt-1">{businessName.length}/25</p>
      </div>

      <div>
        <Label htmlFor="long-headline">Long Headline (90 chars max)</Label>
        <div className="flex gap-2">
          <Input
            id="long-headline"
            value={longHeadline}
            onChange={(e) => setLongHeadline(e.target.value.slice(0, 90))}
            placeholder="Your main promotional message"
            maxLength={90}
          />
          <ElementQuickInsert
            elementType="headline"
            onInsert={(text) => setLongHeadline(text.slice(0, 90))}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{longHeadline.length}/90</p>
      </div>

      <div>
        <Label>Short Headlines (5x 30 chars max)</Label>
        {shortHeadlines.map((headline, index) => (
          <div key={index} className="flex gap-2 mt-2">
            <Input
              value={headline}
              onChange={(e) => {
                const newHeadlines = [...shortHeadlines];
                newHeadlines[index] = e.target.value.slice(0, 30);
                setShortHeadlines(newHeadlines);
              }}
              placeholder={adEntity ? `Short headline ${index + 1}` : "Select entity first"}
              maxLength={30}
              disabled={!adEntity}
            />
            <ElementQuickInsert
              elementType="headline"
              onInsert={(text) => {
                const newHeadlines = [...shortHeadlines];
                newHeadlines[index] = text.slice(0, 30);
                setShortHeadlines(newHeadlines);
              }}
            />
            <span className="text-xs text-muted-foreground min-w-12 flex items-center">
              {headline.length}/30
            </span>
          </div>
        ))}
      </div>

      <div>
        <Label>Descriptions (5x 90 chars max)</Label>
        {descriptions.map((desc, index) => (
          <div key={index} className="flex gap-2 mt-2">
            <Textarea
              value={desc}
              onChange={(e) => {
                const newDescs = [...descriptions];
                newDescs[index] = e.target.value.slice(0, 90);
                setDescriptions(newDescs);
              }}
              placeholder={adEntity ? `Description ${index + 1}` : "Select entity first"}
              maxLength={90}
              rows={2}
              disabled={!adEntity}
            />
            <ElementQuickInsert
              elementType="description"
              onInsert={(text) => {
                const newDescs = [...descriptions];
                newDescs[index] = text.slice(0, 90);
                setDescriptions(newDescs);
              }}
            />
            <span className="text-xs text-muted-foreground min-w-12 flex items-start pt-2">
              {desc.length}/90
            </span>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="cta">Call to Action</Label>
        <Select value={ctaText} onValueChange={setCtaText}>
          <SelectTrigger>
            <SelectValue placeholder="Select CTA..." />
          </SelectTrigger>
          <SelectContent>
            {CTA_OPTIONS.map((cta) => (
              <SelectItem key={cta} value={cta}>{cta}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="landing-page-display">Landing Page URL</Label>
        <Input
          id="landing-page-display"
          value={landingPage}
          onChange={(e) => setLandingPage(e.target.value)}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );
}
