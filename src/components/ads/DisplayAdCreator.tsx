import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ElementQuickInsert } from './ElementQuickInsert';
import { Save, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

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
  const { user } = useAuth();

  const saveAsElement = async (content: string, type: string) => {
    if (!content.trim() || !adEntity || !user) {
      toast({
        title: "Cannot save",
        description: "Select entity and enter content first",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase.from('ad_elements').insert({
      element_type: type,
      content: { text: content },
      entity: [adEntity],
      created_by: user.id,
      tags: [adEntity, type],
      google_status: 'pending'
    });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "✓ Saved to library", 
        description: `Tagged with ${adEntity}` 
      });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="business-name">Business Name (25 chars max)</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="business-name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value.slice(0, 25))}
            placeholder={adEntity ? "Your Business Name" : "Select entity first"}
            maxLength={25}
            disabled={!adEntity}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => saveAsElement(businessName, 'headline')}
            disabled={!businessName.trim() || !adEntity}
            title="Save for reuse"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(businessName)}
            disabled={!businessName}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{businessName.length}/25</p>
      </div>

      <div>
        <Label htmlFor="long-headline">Long Headline (90 chars max)</Label>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <RichTextEditor
              value={longHeadline}
              onChange={(value) => {
                const plainText = value.replace(/<[^>]*>/g, '');
                setLongHeadline(plainText.slice(0, 90));
              }}
              placeholder={adEntity ? "Your main promotional message" : "Select entity first"}
              disabled={!adEntity}
              minHeight="60px"
            />
            <p className="text-xs text-muted-foreground mt-1">{longHeadline.length}/90</p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <ElementQuickInsert
              elementType="headline"
              onInsert={(text) => setLongHeadline(text.slice(0, 90))}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => saveAsElement(longHeadline, 'headline')}
              disabled={!longHeadline.trim() || !adEntity}
              title="Save for reuse"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(longHeadline)}
              disabled={!longHeadline}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Label>Short Headlines (5x 30 chars max)</Label>
        {shortHeadlines.map((headline, index) => (
          <div key={index} className="flex gap-2 mt-2 items-start">
            <div className="flex-1">
              <RichTextEditor
                value={headline}
                onChange={(value) => {
                  const newHeadlines = [...shortHeadlines];
                  const plainText = value.replace(/<[^>]*>/g, '');
                  newHeadlines[index] = plainText.slice(0, 30);
                  setShortHeadlines(newHeadlines);
                }}
                placeholder={adEntity ? `Short headline ${index + 1}` : "Select entity first"}
                disabled={!adEntity}
                minHeight="40px"
              />
              <span className="text-xs text-muted-foreground">
                {headline.length}/30
              </span>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <ElementQuickInsert
                elementType="headline"
                onInsert={(text) => {
                  const newHeadlines = [...shortHeadlines];
                  newHeadlines[index] = text.slice(0, 30);
                  setShortHeadlines(newHeadlines);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => saveAsElement(headline, 'headline')}
                disabled={!headline.trim() || !adEntity}
                title="Save for reuse"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(headline)}
                disabled={!headline}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <Label>Descriptions (5x 90 chars max)</Label>
        {descriptions.map((desc, index) => (
          <div key={index} className="flex gap-2 mt-2 items-start">
            <div className="flex-1">
              <RichTextEditor
                value={desc}
                onChange={(value) => {
                  const newDescs = [...descriptions];
                  const plainText = value.replace(/<[^>]*>/g, '');
                  newDescs[index] = plainText.slice(0, 90);
                  setDescriptions(newDescs);
                }}
                placeholder={adEntity ? `Description ${index + 1}` : "Select entity first"}
                disabled={!adEntity}
                minHeight="60px"
              />
              <span className="text-xs text-muted-foreground">
                {desc.length}/90
              </span>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <ElementQuickInsert
                elementType="description"
                onInsert={(text) => {
                  const newDescs = [...descriptions];
                  newDescs[index] = text.slice(0, 90);
                  setDescriptions(newDescs);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => saveAsElement(desc, 'description')}
                disabled={!desc.trim() || !adEntity}
                title="Save for reuse"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(desc)}
                disabled={!desc}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
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
