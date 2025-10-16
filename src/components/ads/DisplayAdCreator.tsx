import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { ElementQuickInsert } from './ElementQuickInsert';
import { CreateElementDialog } from './CreateElementDialog';

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
}: DisplayAdCreatorProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveElementType, setSaveElementType] = useState<'business_name' | 'long_headline' | 'headline' | 'description' | 'cta'>('business_name');
  const [saveElementContent, setSaveElementContent] = useState('');

  const handleSaveElement = (type: 'business_name' | 'long_headline' | 'cta', content: string) => {
    setSaveElementType(type);
    setSaveElementContent(content);
    setShowSaveDialog(true);
  };

  return (
    <>
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="business-name">Business Name (25 chars max)</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleSaveElement('business_name', businessName)}
            disabled={!businessName}
          >
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>
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
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="long-headline">Long Headline (90 chars max)</Label>
          <div className="flex gap-2">
            <ElementQuickInsert
              elementType="long_headline"
              onInsert={(text) => setLongHeadline(text.slice(0, 90))}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => handleSaveElement('long_headline', longHeadline)}
              disabled={!longHeadline}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Input
          id="long-headline"
          value={longHeadline}
          onChange={(e) => setLongHeadline(e.target.value.slice(0, 90))}
          placeholder="Your main promotional message"
          maxLength={90}
        />
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
              placeholder={`Short headline ${index + 1}`}
              maxLength={30}
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
              placeholder={`Description ${index + 1}`}
              maxLength={90}
              rows={2}
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
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="cta">Call to Action</Label>
          <div className="flex gap-2">
            <ElementQuickInsert
              elementType="cta"
              onInsert={(text) => setCtaText(text)}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => handleSaveElement('cta', ctaText)}
              disabled={!ctaText}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>
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

    <CreateElementDialog
      open={showSaveDialog}
      onOpenChange={setShowSaveDialog}
      elementType={saveElementType}
      initialContent={saveElementContent}
    />
    </>
  );
}
