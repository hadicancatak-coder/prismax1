import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Copy, Sparkles, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AdsPage() {
  const [headlines, setHeadlines] = useState<string[]>(Array(15).fill(""));
  const [descriptions, setDescriptions] = useState<string[]>(Array(4).fill(""));
  const [landingPage, setLandingPage] = useState("");
  const [sitelinks, setSitelinks] = useState<{ title: string; description: string }[]>(
    Array(4).fill({ title: "", description: "" })
  );
  const [callouts, setCallouts] = useState<string[]>(Array(4).fill(""));

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleCopyAll = () => {
    const allContent = `
HEADLINES:
${headlines.filter(h => h).map((h, i) => `${i + 1}. ${h}`).join('\n')}

DESCRIPTIONS:
${descriptions.filter(d => d).map((d, i) => `${i + 1}. ${d}`).join('\n')}

LANDING PAGE:
${landingPage}

SITELINKS:
${sitelinks.filter(s => s.title).map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')}

CALLOUTS:
${callouts.filter(c => c).map((c, i) => `${i + 1}. ${c}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(allContent);
    toast({ title: "All content copied to clipboard" });
  };

  const getRandomItems = <T,>(arr: T[], count: number): T[] => {
    const filtered = arr.filter((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "object" && item !== null && "title" in item) {
        return (item as { title: string }).title.trim();
      }
      return false;
    });
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, filtered.length));
  };

  const previewHeadlines = getRandomItems(headlines, 3);
  const previewDescriptions = getRandomItems(descriptions, 2);
  const previewSitelinks = getRandomItems(sitelinks, 4);
  const previewCallouts = getRandomItems(callouts, 4);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            Google Ads Planner - Search
          </h1>
          <p className="text-muted-foreground mt-1">Plan your Google Search Ads campaigns following best practices</p>
        </div>
        <Button onClick={handleCopyAll} variant="outline">
          <Copy className="h-4 w-4 mr-2" />
          Copy All
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Headlines */}
          <Card>
            <CardHeader>
              <CardTitle>Headlines (15 Required)</CardTitle>
              <CardDescription>Max 30 characters each. Include keywords and benefits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {headlines.map((headline, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Headline {index + 1}</Label>
                    <Input
                      value={headline}
                      onChange={(e) => {
                        const newHeadlines = [...headlines];
                        newHeadlines[index] = e.target.value.slice(0, 30);
                        setHeadlines(newHeadlines);
                      }}
                      placeholder={`Enter headline ${index + 1}`}
                      maxLength={30}
                    />
                    <span className="text-xs text-muted-foreground">{headline.length}/30</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(headline)}
                    disabled={!headline}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Descriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Descriptions (4 Required)</CardTitle>
              <CardDescription>Max 90 characters each. Expand on headlines with details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {descriptions.map((desc, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Description {index + 1}</Label>
                    <Textarea
                      value={desc}
                      onChange={(e) => {
                        const newDescs = [...descriptions];
                        newDescs[index] = e.target.value.slice(0, 90);
                        setDescriptions(newDescs);
                      }}
                      placeholder={`Enter description ${index + 1}`}
                      maxLength={90}
                      rows={2}
                    />
                    <span className="text-xs text-muted-foreground">{desc.length}/90</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(desc)}
                    disabled={!desc}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Landing Page */}
          <Card>
            <CardHeader>
              <CardTitle>Landing Page URL</CardTitle>
              <CardDescription>The final destination URL for your ad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={landingPage}
                  onChange={(e) => setLandingPage(e.target.value)}
                  placeholder="https://example.com/landing-page"
                  type="url"
                />
                <Button variant="ghost" onClick={() => handleCopy(landingPage)} disabled={!landingPage}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sitelinks */}
          <Card>
            <CardHeader>
              <CardTitle>Sitelinks (4 Recommended)</CardTitle>
              <CardDescription>Additional links below your ad. Title: 25 chars, Description: 35 chars</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sitelinks.map((link, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Sitelink {index + 1} Title</Label>
                    <Input
                      value={link.title}
                      onChange={(e) => {
                        const newLinks = [...sitelinks];
                        newLinks[index] = { ...newLinks[index], title: e.target.value.slice(0, 25) };
                        setSitelinks(newLinks);
                      }}
                      placeholder="Enter sitelink title"
                      maxLength={25}
                    />
                    <span className="text-xs text-muted-foreground">{link.title.length}/25</span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Input
                      value={link.description}
                      onChange={(e) => {
                        const newLinks = [...sitelinks];
                        newLinks[index] = { ...newLinks[index], description: e.target.value.slice(0, 35) };
                        setSitelinks(newLinks);
                      }}
                      placeholder="Enter sitelink description"
                      maxLength={35}
                    />
                    <span className="text-xs text-muted-foreground">{link.description.length}/35</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Callouts */}
          <Card>
            <CardHeader>
              <CardTitle>Callouts (4 Recommended)</CardTitle>
              <CardDescription>Max 25 characters each. Highlight unique selling points.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {callouts.map((callout, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Callout {index + 1}</Label>
                    <Input
                      value={callout}
                      onChange={(e) => {
                        const newCallouts = [...callouts];
                        newCallouts[index] = e.target.value.slice(0, 25);
                        setCallouts(newCallouts);
                      }}
                      placeholder="e.g., Free Shipping, 24/7 Support"
                      maxLength={25}
                    />
                    <span className="text-xs text-muted-foreground">{callout.length}/25</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(callout)}
                    disabled={!callout}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Ad Preview
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>Live preview of your Google Search Ad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ad Preview Box */}
              <div className="border rounded-lg p-4 bg-background space-y-3">
                {/* Ad Label */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 border border-foreground/20 rounded">Ad</span>
                  <span className="text-xs text-muted-foreground truncate">{landingPage || "yourdomain.com"}</span>
                </div>

                {/* Headlines */}
                <div className="space-y-1">
                  <h3 className="text-xl text-primary font-normal leading-tight">
                    {previewHeadlines.length > 0 
                      ? previewHeadlines.join(" • ") 
                      : "Your headline will appear here • Add headlines to see preview"}
                  </h3>
                </div>

                {/* Display URL */}
                <div className="text-sm text-foreground/80">
                  {landingPage ? new URL(landingPage).hostname : "www.yourdomain.com"} {landingPage && <span className="text-foreground/60">› page</span>}
                </div>

                {/* Descriptions */}
                <div className="text-sm text-foreground/70 leading-relaxed">
                  {previewDescriptions.length > 0
                    ? previewDescriptions.join(" ")
                    : "Your descriptions will appear here. Add up to 4 descriptions to see how they look."}
                </div>

                {/* Sitelinks */}
                {previewSitelinks.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {previewSitelinks.map((link, index) => (
                        <div key={index}>
                          <div className="text-sm text-primary font-normal">{link.title}</div>
                          <div className="text-xs text-foreground/60 line-clamp-1">{link.description}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Callouts */}
                {previewCallouts.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="flex flex-wrap gap-2">
                      {previewCallouts.map((callout, index) => (
                        <span key={index} className="text-xs text-foreground/70">
                          {callout}
                          {index < previewCallouts.length - 1 && " • "}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Preview shows random selection of your inputs</p>
                <p>• Google may show different combinations</p>
                <p>• Actual ad appearance may vary</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}