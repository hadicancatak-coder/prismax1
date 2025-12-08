import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Pencil, Trash2, Save, X, ChevronLeft, ChevronRight, MessageSquare, History, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AdStrengthIndicator } from "./AdStrengthIndicator";
import { AdComplianceChecker } from "./AdComplianceChecker";
import { AdVersionHistory } from "./ads/AdVersionHistory";
import { AdComments } from "./ads/AdComments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface SavedAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad: any;
  onUpdate: () => void;
}

export function SavedAdDialog({ open, onOpenChange, ad, onUpdate }: SavedAdDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(ad?.name || "");
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [landingPage, setLandingPage] = useState("");
  const [sitelinks, setSitelinks] = useState<{ title: string; description: string }[]>([]);
  const [callouts, setCallouts] = useState<string[]>([]);
  const [combinationIndex, setCombinationIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { copy } = useCopyToClipboard();

  const handleDuplicate = async () => {
    try {
      const { error } = await supabase.from('ads').insert({
        ...ad,
        id: undefined,
        name: `${ad.name} (Copy)`,
        created_at: undefined,
        updated_at: undefined,
      });

      if (error) throw error;
      toast({ title: 'Success', description: 'Ad duplicated successfully' });
      onOpenChange(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to duplicate ad', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (ad) {
      setName(ad.name);
      setHeadlines(JSON.parse(ad.headlines || "[]"));
      setDescriptions(JSON.parse(ad.descriptions || "[]"));
      setLandingPage(ad.landing_page || "");
      setSitelinks(JSON.parse(ad.sitelinks || "[]"));
      setCallouts(JSON.parse(ad.callouts || "[]"));
      setCombinationIndex(0);
    }
  }, [ad]);

  const handleSave = async () => {
    const { error } = await supabase
      .from("ads")
      .update({
        name,
        headlines: JSON.stringify(headlines),
        descriptions: JSON.stringify(descriptions),
        landing_page: landingPage,
        sitelinks: JSON.stringify(sitelinks),
        callouts: JSON.stringify(callouts),
      })
      .eq("id", ad.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Ad updated" });
      setIsEditing(false);
      onUpdate();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase.from("ads").delete().eq("id", ad.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Ad deleted" });
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onUpdate();
    }
  };

  if (!ad) return null;

  const activeHeadlines = headlines.filter((h) => h.trim());
  const activeDescriptions = descriptions.filter((d) => d.trim());
  const activeSitelinks = sitelinks.filter((s) => s.title.trim());
  const activeCallouts = callouts.filter((c) => c.trim());

  const getItemsForCombination = <T,>(items: T[], count: number, seed: number): T[] => {
    if (items.length <= count) return items;
    const result: T[] = [];
    const available = [...items];
    let currentSeed = seed;
    
    for (let i = 0; i < count && available.length > 0; i++) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const index = currentSeed % available.length;
      result.push(available[index]);
      available.splice(index, 1);
    }
    
    return result;
  };

  const previewHeadlines = getItemsForCombination(activeHeadlines, 3, combinationIndex);
  const previewDescriptions = getItemsForCombination(activeDescriptions, 2, combinationIndex + 1);
  const previewSitelinks = getItemsForCombination(activeSitelinks, 4, combinationIndex + 2);
  const previewCallouts = getItemsForCombination(activeCallouts, 4, combinationIndex + 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle>
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl font-semibold"
              />
            ) : (
              <span>{ad.name}</span>
            )}
          </DialogTitle>
          <DialogDescription>
            {ad.entity && `Entity: ${ad.entity} • `}
            {ad.campaign_name && `Campaign: ${ad.campaign_name} • `}
            {ad.ad_group_name && `Ad Group: ${ad.ad_group_name} • `}
            Created: {new Date(ad.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-2 flex items-center justify-end gap-2 border-b shrink-0">
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
        </div>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0 mx-6 mt-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Version History
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 mt-4">
          {/* Ad Preview */}
          <Card className="p-4 bg-background">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCombinationIndex(Math.max(0, combinationIndex - 1))}
                disabled={combinationIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Preview {combinationIndex + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCombinationIndex(combinationIndex + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 border border-foreground/20 rounded">
              Ad
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {landingPage ? new URL(landingPage).hostname : "yourdomain.com"}
            </span>
          </div>

          <h3 className="text-xl text-primary font-normal leading-tight mb-2">
            {previewHeadlines.length > 0
              ? previewHeadlines.join(" • ")
              : "No headlines"}
          </h3>

          <div className="text-sm text-foreground/80 mb-2">
            {landingPage
              ? new URL(landingPage).hostname
              : "www.yourdomain.com"}{" "}
            {landingPage && <span className="text-foreground/60">› page</span>}
          </div>

          <div className="text-sm text-foreground/70 leading-relaxed mb-3">
            {previewDescriptions.length > 0
              ? previewDescriptions.join(" ")
              : "No descriptions"}
          </div>

          {previewSitelinks.length > 0 && (
            <>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {previewSitelinks.map((link, index) => (
                  <div key={index}>
                    <div className="text-sm text-primary font-normal">{link.title}</div>
                    <div className="text-xs text-foreground/60 line-clamp-1">
                      {link.description}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

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
          </Card>

          {/* Quality & Compliance Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdStrengthIndicator
              headlines={activeHeadlines}
              descriptions={activeDescriptions}
              sitelinks={activeSitelinks.map(s => s.title)}
              callouts={activeCallouts}
            />
            <AdComplianceChecker
              headlines={activeHeadlines}
              descriptions={activeDescriptions}
              sitelinks={activeSitelinks.map(s => s.title)}
              callouts={activeCallouts}
              entity={ad.entity}
            />
          </div>

          {/* Content Details */}
          <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Headlines ({activeHeadlines.length})</h4>
            {isEditing ? (
              <div className="space-y-2">
                {headlines.map((h, i) => (
                  <div key={i} className="space-y-1">
                    <Input
                      value={h}
                      onChange={(e) => {
                        const newHeadlines = [...headlines];
                        newHeadlines[i] = e.target.value.slice(0, 30);
                        setHeadlines(newHeadlines);
                      }}
                      placeholder={`Headline ${i + 1}`}
                      maxLength={30}
                      className="text-sm"
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {h.length}/30 characters
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {activeHeadlines.map((h, i) => (
                  <li key={i} className="text-sm">
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-2">
              Descriptions ({activeDescriptions.length})
            </h4>
            {isEditing ? (
              <div className="space-y-2">
                {descriptions.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <Textarea
                      value={d}
                      onChange={(e) => {
                        const newDescs = [...descriptions];
                        newDescs[i] = e.target.value.slice(0, 90);
                        setDescriptions(newDescs);
                      }}
                      placeholder={`Description ${i + 1}`}
                      maxLength={90}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {d.length}/90 characters
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {activeDescriptions.map((d, i) => (
                  <li key={i} className="text-sm">
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {landingPage && (
            <div>
              <h4 className="font-semibold mb-2">Landing Page</h4>
              {isEditing ? (
                <Input
                  value={landingPage}
                  onChange={(e) => setLandingPage(e.target.value)}
                  placeholder="Landing Page URL"
                  type="url"
                />
              ) : (
                <a
                  href={landingPage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {landingPage}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {activeSitelinks.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Sitelinks ({activeSitelinks.length})</h4>
              {isEditing ? (
                <div className="space-y-3">
                  {sitelinks.map((link, i) => (
                    <div key={i} className="space-y-2 p-3 border rounded">
                      <div className="space-y-1">
                        <Input
                          value={link.title}
                          onChange={(e) => {
                            const newLinks = [...sitelinks];
                            newLinks[i] = {
                              ...newLinks[i],
                              title: e.target.value.slice(0, 25),
                            };
                            setSitelinks(newLinks);
                          }}
                          placeholder={`Sitelink ${i + 1} Title`}
                          maxLength={25}
                        />
                        <div className="text-xs text-muted-foreground text-right">
                          {link.title.length}/25 characters
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Input
                          value={link.description}
                          onChange={(e) => {
                            const newLinks = [...sitelinks];
                            newLinks[i] = {
                              ...newLinks[i],
                              description: e.target.value.slice(0, 35),
                            };
                            setSitelinks(newLinks);
                          }}
                          placeholder="Description"
                          maxLength={35}
                        />
                        <div className="text-xs text-muted-foreground text-right">
                          {link.description.length}/35 characters
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {activeSitelinks.map((s, i) => (
                    <li key={i} className="text-sm">
                      <strong>{s.title}:</strong> {s.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeCallouts.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Callouts ({activeCallouts.length})</h4>
              {isEditing ? (
                <div className="space-y-2">
                  {callouts.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <Input
                        value={c}
                        onChange={(e) => {
                          const newCallouts = [...callouts];
                          newCallouts[i] = e.target.value.slice(0, 25);
                          setCallouts(newCallouts);
                        }}
                        placeholder={`Callout ${i + 1}`}
                        maxLength={25}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {c.length}/25 characters
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {activeCallouts.map((c, i) => (
                    <li key={i} className="text-sm">
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto px-6 pb-4">
            <AdVersionHistory adId={ad.id} />
          </TabsContent>

          <TabsContent value="comments" className="flex-1 overflow-y-auto px-6 pb-4">
            <AdComments adId={ad.id} />
          </TabsContent>
        </Tabs>

        {/* Actions - Fixed Footer */}
        <div className="shrink-0 flex gap-2 p-6 border-t bg-background">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} className="flex-1">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} variant="destructive" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="z-overlay" onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this ad?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
