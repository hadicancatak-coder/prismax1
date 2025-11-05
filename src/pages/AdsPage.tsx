import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Copy, Sparkles, ExternalLink, Save, Trash2, ChevronLeft, ChevronRight, CheckCircle, BookOpen, Library } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { SavedAdDialog } from "@/components/SavedAdDialog";
import { AdApprovalSection } from "@/components/AdApprovalSection";
import { AdStrengthIndicator } from "@/components/AdStrengthIndicator";
import { ENTITIES } from "@/lib/constants";
import { SavedElementsLibrary } from "@/components/ads/SavedElementsLibrary";
import { TemplateSelector } from "@/components/ads/TemplateSelector";
import { ElementQuickInsert } from "@/components/ads/ElementQuickInsert";
import { DisplayAdCreator } from "@/components/ads/DisplayAdCreator";
import { DisplayAdPreview } from "@/components/ads/DisplayAdPreview";
import { AdvancedFilters } from "@/components/ads/AdvancedFilters";
import { BulkActionsBar } from "@/components/ads/BulkActionsBar";
import { useIncrementElementUsage } from "@/hooks/useAdElements";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmPopover } from "@/components/ui/ConfirmPopover";

export default function AdsPage() {
  const { user } = useAuth();
  const [adName, setAdName] = useState("");
  const [adEntity, setAdEntity] = useState("");
  const [headlines, setHeadlines] = useState<string[]>(Array(15).fill(""));
  const [descriptions, setDescriptions] = useState<string[]>(Array(4).fill(""));
  const [landingPage, setLandingPage] = useState("");
  const [sitelinks, setSitelinks] = useState<{ title: string; description: string }[]>(
    Array(4).fill({ title: "", description: "" })
  );
  const [callouts, setCallouts] = useState<string[]>(Array(4).fill(""));
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [combinationIndex, setCombinationIndex] = useState(0);
  const [quickInsertType, setQuickInsertType] = useState<'headline' | 'description'>('headline');
  const [quickInsertIndex, setQuickInsertIndex] = useState(0);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  
  // Display ad states
  const [businessName, setBusinessName] = useState("");
  const [longHeadline, setLongHeadline] = useState("");
  const [shortHeadlines, setShortHeadlines] = useState<string[]>(Array(5).fill(""));
  const [ctaText, setCtaText] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<'EN' | 'AR'>('EN');
  
  const incrementUsage = useIncrementElementUsage();

  // Auto-detect language from ad content
  useEffect(() => {
    const detectLanguage = (text: string): 'EN' | 'AR' => {
      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
      return arabicRegex.test(text) ? 'AR' : 'EN';
    };

    const allText = [
      ...headlines.filter(h => h),
      ...descriptions.filter(d => d),
      businessName,
      longHeadline,
      ...shortHeadlines.filter(h => h)
    ].join(' ');
    
    setDetectedLanguage(detectLanguage(allText));
  }, [headlines, descriptions, businessName, longHeadline, shortHeadlines]);

  useEffect(() => {
    fetchSavedAds();
    
    const channel = supabase
      .channel('ads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, () => {
        fetchSavedAds();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSavedAds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching ads:", error);
        toast({ 
          title: "Error loading ads", 
          description: error.message, 
          variant: "destructive" 
        });
        setSavedAds([]);
      } else {
        console.log("Fetched ads:", data);
        setSavedAds(data || []);
      }
    } catch (err) {
      console.error("Exception fetching ads:", err);
      setSavedAds([]);
    } finally {
      setLoading(false);
    }
  };

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

  const saveAsElement = async (content: string, type: string, entity: string) => {
    if (!content.trim() || !entity) {
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
      entity: [entity],
      created_by: user!.id,
      tags: [entity, type],
      google_status: 'pending'
    });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "✓ Saved to library", 
        description: `Tagged with ${entity}` 
      });
    }
  };

  const handleSaveAd = async () => {
    if (!user || !adName.trim()) {
      toast({ title: "Error", description: "Please enter an ad name", variant: "destructive" });
      return;
    }

    // Validate entity is selected
    if (!adEntity) {
      toast({ 
        title: "Entity Required", 
        description: "Please select an entity before saving", 
        variant: "destructive" 
      });
      return;
    }

    // Validate has content
    const hasHeadlines = headlines.some(h => h.trim());
    const hasDescriptions = descriptions.some(d => d.trim());
    
    if (!hasHeadlines || !hasDescriptions) {
      toast({
        title: "Content Required",
        description: "Add at least one headline and description",
        variant: "destructive"
      });
      return;
    }

    const adData = {
      name: adName.trim(),
      entity: adEntity,
      headlines: JSON.stringify(headlines),
      descriptions: JSON.stringify(descriptions),
      landing_page: landingPage || null,
      sitelinks: JSON.stringify(sitelinks),
      callouts: JSON.stringify(callouts),
      created_by: user.id,
    };

    if (editingAdId) {
      const { error } = await supabase
        .from("ads")
        .update(adData)
        .eq("id", editingAdId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Ad updated successfully" });
        setEditingAdId(null);
        fetchSavedAds();
      }
    } else {
      const { error } = await supabase
        .from("ads")
        .insert([adData]);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Ad saved successfully" });
        fetchSavedAds();
        handleClearForm();
      }
    }
  };

  const handleLoadAd = (ad: any) => {
    setAdName(ad.name);
    setAdEntity(ad.entity || "");
    setHeadlines(JSON.parse(ad.headlines));
    setDescriptions(JSON.parse(ad.descriptions));
    setLandingPage(ad.landing_page || "");
    setSitelinks(JSON.parse(ad.sitelinks));
    setCallouts(JSON.parse(ad.callouts));
    setEditingAdId(ad.id);
  };

  const handleDeleteAd = async (id: string) => {
    const { error } = await supabase
      .from("ads")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ad deleted successfully" });
      fetchSavedAds();
      if (editingAdId === id) {
        handleClearForm();
      }
    }
  };

  const handleClearForm = () => {
    setAdName("");
    setAdEntity("");
    setHeadlines(Array(15).fill(""));
    setDescriptions(Array(4).fill(""));
    setLandingPage("");
    setSitelinks(Array(4).fill({ title: "", description: "" }));
    setCallouts(Array(4).fill(""));
    setEditingAdId(null);
  };

  const getItemsForCombination = <T,>(arr: T[], count: number, seed: number): T[] => {
    const filtered = arr.filter((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "object" && item !== null && "title" in item) {
        return (item as { title: string }).title.trim();
      }
      return false;
    });
    
    if (filtered.length === 0) return [];
    
    // Use seed to get deterministic "random" selection
    const result: T[] = [];
    for (let i = 0; i < Math.min(count, filtered.length); i++) {
      const index = (seed + i * 7) % filtered.length;
      if (!result.includes(filtered[index])) {
        result.push(filtered[index]);
      }
    }
    return result;
  };

  const previewHeadlines = getItemsForCombination(headlines, 3, combinationIndex);
  const previewDescriptions = getItemsForCombination(descriptions, 2, combinationIndex);
  const previewSitelinks = getItemsForCombination(sitelinks, 4, combinationIndex);
  const previewCallouts = getItemsForCombination(callouts, 4, combinationIndex);

  const handleNextCombination = () => {
    setCombinationIndex((prev) => prev + 1);
  };

  const handlePrevCombination = () => {
    setCombinationIndex((prev) => Math.max(0, prev - 1));
  };

  const handleQuickInsert = (content: string) => {
    if (quickInsertType === 'headline') {
      const newHeadlines = [...headlines];
      newHeadlines[quickInsertIndex] = content.slice(0, 30);
      setHeadlines(newHeadlines);
    } else {
      const newDescriptions = [...descriptions];
      newDescriptions[quickInsertIndex] = content.slice(0, 90);
      setDescriptions(newDescriptions);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setAdName(template.name || "");
    setAdEntity(template.entity || "");
    
    if (template.ad_type === 'display') {
      // Load display ad data
      setBusinessName(template.business_name || "");
      setLongHeadline(template.long_headline || "");
      setShortHeadlines(template.short_headlines || Array(5).fill(""));
      setCtaText(template.cta_text || "");
      setDescriptions(template.descriptions || Array(4).fill(""));
      setLandingPage(template.landing_page || "");
    } else {
      // Load search ad data
      setHeadlines(template.headlines || Array(15).fill(""));
      setDescriptions(template.descriptions || Array(4).fill(""));
      setLandingPage(template.landing_page || "");
      setSitelinks(template.sitelinks || Array(4).fill({ title: "", description: "" }));
      setCallouts(template.callouts || Array(4).fill(""));
    }
    
    setTemplateSelectorOpen(false);
    toast({ title: "Template loaded" });
  };

  const handleBulkDelete = async () => {
    const { error } = await supabase.from('ads').delete().in('id', selectedAdIds);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${selectedAdIds.length} ads deleted` });
      setSelectedAdIds([]);
      fetchSavedAds();
    }
  };

  const handleSaveDisplayAd = async () => {
    if (!user || !adName.trim()) {
      toast({ title: "Error", description: "Please enter an ad name", variant: "destructive" });
      return;
    }

    if (!adEntity) {
      toast({ title: "Entity Required", description: "Please select an entity", variant: "destructive" });
      return;
    }

    const hasHeadlines = businessName.trim() || longHeadline.trim() || shortHeadlines.some(h => h.trim());
    const hasDescriptions = descriptions.some(d => d.trim());
    
    if (!hasHeadlines || !hasDescriptions) {
      toast({ title: "Content Required", description: "Add headlines and descriptions", variant: "destructive" });
      return;
    }

    const adData = {
      name: adName.trim(),
      entity: adEntity,
      ad_type: 'display',
      business_name: businessName,
      long_headline: longHeadline,
      short_headlines: shortHeadlines,
      descriptions: descriptions,
      cta_text: ctaText,
      landing_page: landingPage || null,
      created_by: user.id,
    };

    const { error } = await supabase.from("ads").insert([adData]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Display ad saved successfully" });
      fetchSavedAds();
      handleClearDisplayAd();
    }
  };

  const handleCopyAllDisplay = () => {
    const allContent = `
BUSINESS NAME:
${businessName}

LONG HEADLINE:
${longHeadline}

SHORT HEADLINES:
${shortHeadlines.filter(h => h).map((h, i) => `${i + 1}. ${h}`).join('\n')}

DESCRIPTIONS:
${descriptions.filter(d => d).map((d, i) => `${i + 1}. ${d}`).join('\n')}

CALL TO ACTION:
${ctaText}

LANDING PAGE:
${landingPage}
    `.trim();
    
    navigator.clipboard.writeText(allContent);
    toast({ title: "All display ad content copied to clipboard" });
  };

  const handleClearDisplayAd = () => {
    setBusinessName("");
    setLongHeadline("");
    setShortHeadlines(Array(5).fill(""));
    setCtaText("");
    setLandingPage("");
    setAdName("");
  };

  const filteredSavedAds = savedAds.filter((ad) => {
    const entityMatch = entityFilter === "all" || ad.entity === entityFilter;
    const monthMatch = monthFilter === "all" || format(new Date(ad.created_at), "yyyy-MM") === monthFilter;
    const statusMatch = !advancedFilters.googleStatus || ad.approval_status === advancedFilters.googleStatus;
    return entityMatch && monthMatch && statusMatch;
  });

  const availableMonths = Array.from(
    new Set(savedAds.map((ad) => format(new Date(ad.created_at), "yyyy-MM")))
  ).sort().reverse();

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
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList>
          <TabsTrigger value="create">Create Ads</TabsTrigger>
          <TabsTrigger value="saved">Saved Ads ({savedAds.length})</TabsTrigger>
          <TabsTrigger value="elements">
            <Library className="h-4 w-4 mr-2" />
            Saved Elements
          </TabsTrigger>
          <TabsTrigger value="templates">
            <BookOpen className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <Tabs defaultValue="search" className="w-full">
            <TabsList>
              <TabsTrigger value="search">Search Ads</TabsTrigger>
              <TabsTrigger value="display">Display Ads</TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              {/* Ad Info */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Input
                    value={adName}
                    onChange={(e) => setAdName(e.target.value)}
                    placeholder="Ad Name *"
                  />
                  <Select value={adEntity} onValueChange={setAdEntity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Entity *" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITIES.map((ent) => (
                        <SelectItem key={ent} value={ent}>{ent}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!adEntity && (
                    <p className="text-xs text-destructive">⚠️ Select entity first to enable inputs</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created: {format(new Date(), "MMM dd, yyyy")}
                  </div>
                </CardContent>
              </Card>

              {/* Headlines */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Headlines (15 Required - Max 30 chars)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {headlines.map((headline, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <RichTextEditor
                          value={headline}
                          onChange={(value) => {
                            const newHeadlines = [...headlines];
                            const plainText = value.replace(/<[^>]*>/g, '');
                            newHeadlines[index] = plainText.slice(0, 30);
                            setHeadlines(newHeadlines);
                          }}
                          placeholder={adEntity ? `Headline ${index + 1}` : "Select entity first"}
                          className="text-sm"
                          disabled={!adEntity}
                          minHeight="40px"
                        />
                        <span className="text-xs text-muted-foreground">{headline.length}/30</span>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <ElementQuickInsert
                          elementType="headline"
                          onInsert={(content) => {
                            const newHeadlines = [...headlines];
                            newHeadlines[index] = content.slice(0, 30);
                            setHeadlines(newHeadlines);
                            incrementUsage.mutate(content);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => saveAsElement(headline, 'headline', adEntity)}
                          disabled={!headline.trim() || !adEntity}
                          title="Save for reuse"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(headline)}
                          disabled={!headline}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Descriptions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Descriptions (4 Required - Max 90 chars)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {descriptions.map((desc, index) => (
                    <div key={index} className="flex gap-2 items-start">
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
                          className="text-sm"
                          disabled={!adEntity}
                          minHeight="60px"
                        />
                        <span className="text-xs text-muted-foreground">{desc.length}/90</span>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <ElementQuickInsert
                          elementType="description"
                          onInsert={(content) => {
                            const newDescs = [...descriptions];
                            newDescs[index] = content.slice(0, 90);
                            setDescriptions(newDescs);
                            incrementUsage.mutate(content);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => saveAsElement(desc, 'description', adEntity)}
                          disabled={!desc.trim() || !adEntity}
                          title="Save for reuse"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(desc)}
                          disabled={!desc}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Landing Page */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <Input
                      value={landingPage}
                      onChange={(e) => setLandingPage(e.target.value)}
                      placeholder="Landing Page URL"
                      type="url"
                      className="text-sm"
                    />
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => handleCopy(landingPage)} disabled={!landingPage}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sitelinks */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Sitelinks (Title: 25 chars, Desc: 35 chars)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sitelinks.map((link, index) => (
                    <div key={index} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <RichTextEditor
                            value={link.title}
                            onChange={(value) => {
                              const newLinks = [...sitelinks];
                              const plainText = value.replace(/<[^>]*>/g, '');
                              newLinks[index] = { ...newLinks[index], title: plainText.slice(0, 25) };
                              setSitelinks(newLinks);
                            }}
                            placeholder={adEntity ? `Sitelink ${index + 1} Title` : "Select entity first"}
                            className="text-sm"
                            disabled={!adEntity}
                            minHeight="40px"
                          />
                          <span className="text-xs text-muted-foreground">{link.title.length}/25</span>
                        </div>
                        <ElementQuickInsert
                          elementType="sitelink"
                          onInsert={(content) => {
                            const newLinks = [...sitelinks];
                            newLinks[index] = { ...newLinks[index], title: content.slice(0, 25) };
                            setSitelinks(newLinks);
                          }}
                        />
                        <div className="flex flex-col gap-1 shrink-0">
                          <ElementQuickInsert
                            elementType="sitelink"
                            onInsert={(content) => {
                              const newLinks = [...sitelinks];
                              newLinks[index] = { ...newLinks[index], title: content.slice(0, 25) };
                              setSitelinks(newLinks);
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => saveAsElement(link.title, 'sitelink', adEntity)}
                            disabled={!link.title.trim() || !adEntity}
                            title="Save for reuse"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <RichTextEditor
                            value={link.description}
                            onChange={(value) => {
                              const newLinks = [...sitelinks];
                              const plainText = value.replace(/<[^>]*>/g, '');
                              newLinks[index] = { ...newLinks[index], description: plainText.slice(0, 35) };
                              setSitelinks(newLinks);
                            }}
                            placeholder={adEntity ? "Description" : "Select entity first"}
                            className="text-sm"
                            disabled={!adEntity}
                            minHeight="40px"
                          />
                          <span className="text-xs text-muted-foreground">{link.description.length}/35</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Callouts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Callouts (Max 25 chars)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {callouts.map((callout, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <RichTextEditor
                          value={callout}
                          onChange={(value) => {
                            const newCallouts = [...callouts];
                            const plainText = value.replace(/<[^>]*>/g, '');
                            newCallouts[index] = plainText.slice(0, 25);
                            setCallouts(newCallouts);
                          }}
                          placeholder={adEntity ? `Callout ${index + 1}` : "Select entity first"}
                          className="text-sm"
                          disabled={!adEntity}
                          minHeight="40px"
                        />
                        <span className="text-xs text-muted-foreground">{callout.length}/25</span>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <ElementQuickInsert
                          elementType="callout"
                          onInsert={(content) => {
                            const newCallouts = [...callouts];
                            newCallouts[index] = content.slice(0, 25);
                            setCallouts(newCallouts);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => saveAsElement(callout, 'callout', adEntity)}
                          disabled={!callout.trim() || !adEntity}
                          title="Save for reuse"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(callout)}
                          disabled={!callout}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={handleSaveAd} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingAdId ? "Update Ad" : "Save Ad"}
                </Button>
                <Button onClick={() => setTemplateSelectorOpen(true)} variant="outline" className="flex-1">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Load Template
                </Button>
                <Button onClick={handleCopyAll} variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
                {editingAdId && (
                  <Button onClick={handleClearForm} variant="outline">
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Preview Section - Sticky */}
            <div className="lg:sticky lg:top-8 lg:self-start space-y-4">
              {/* Ad Quality Score */}
              <AdStrengthIndicator
                headlines={headlines.filter(h => h.trim())}
                descriptions={descriptions.filter(d => d.trim())}
                sitelinks={sitelinks.map(s => s.title).filter(t => t.trim())}
                callouts={callouts.filter(c => c.trim())}
              />
              
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Ad Preview
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                      <CardDescription>Live preview of your Google Search Ad</CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevCombination}
                        disabled={combinationIndex === 0}
                        className="h-7 w-7"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextCombination}
                        className="h-7 w-7"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
                    <p>• Use arrows to see different combinations</p>
                    <p>• Google may show different combinations</p>
                    <p>• Actual ad appearance may vary</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="display" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Inputs */}
              <div className="space-y-4">
                {/* Ad Info Card */}
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <Input
                      value={adName}
                      onChange={(e) => setAdName(e.target.value)}
                      placeholder="Ad Name *"
                    />
                    <Select value={adEntity} onValueChange={setAdEntity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Entity *" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITIES.map((ent) => (
                          <SelectItem key={ent} value={ent}>{ent}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!adEntity && (
                      <p className="text-xs text-destructive">⚠️ Select entity first to enable inputs</p>
                    )}
                  </CardContent>
                </Card>

                {/* Display Ad Creator */}
                <DisplayAdCreator
                  businessName={businessName}
                  setBusinessName={setBusinessName}
                  longHeadline={longHeadline}
                  setLongHeadline={setLongHeadline}
                  shortHeadlines={shortHeadlines}
                  setShortHeadlines={setShortHeadlines}
                  descriptions={descriptions}
                  setDescriptions={setDescriptions}
                  ctaText={ctaText}
                  setCtaText={setCtaText}
                  landingPage={landingPage}
                  setLandingPage={setLandingPage}
                  adEntity={adEntity}
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleSaveDisplayAd} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Display Ad
                  </Button>
                  <Button onClick={() => setTemplateSelectorOpen(true)} variant="outline" className="flex-1">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Load Template
                  </Button>
                  <Button onClick={handleCopyAllDisplay} variant="outline" className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                </div>
              </div>

              {/* Right Column - Preview (sticky) */}
              <div className="lg:sticky lg:top-8 lg:self-start">
                <DisplayAdPreview
                  businessName={businessName}
                  longHeadline={longHeadline}
                  shortHeadlines={shortHeadlines}
                  descriptions={descriptions}
                  ctaText={ctaText}
                  landingPage={landingPage}
                  language={detectedLanguage}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <div className="mb-6 flex gap-4">
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {ENTITIES.map((ent) => (
                  <SelectItem key={ent} value={ent}>{ent}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {format(new Date(month + "-01"), "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <AdvancedFilters
              onFiltersChange={(filters) => setAdvancedFilters(filters)}
            />
          </div>

          <div className="grid gap-4">
            {loading ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Loading ads...</p>
              </Card>
            ) : filteredSavedAds.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground text-lg mb-4">
                  {savedAds.length === 0 
                    ? "No saved ads yet" 
                    : "No ads match your filters"}
                </p>
                {savedAds.length > 0 && (
                  <Button variant="outline" onClick={() => {
                    setEntityFilter("all");
                    setMonthFilter("all");
                  }}>
                    Clear Filters
                  </Button>
                )}
              </Card>
            ) : (
              filteredSavedAds.map((ad) => (
                <Card 
                  key={ad.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedAd(ad);
                    setAdDialogOpen(true);
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Checkbox
                            checked={selectedAdIds.includes(ad.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAdIds([...selectedAdIds, ad.id]);
                              } else {
                                setSelectedAdIds(selectedAdIds.filter(id => id !== ad.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {ad.approval_status === 'approved' && (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                          <h3 className="font-semibold text-lg">{ad.name}</h3>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {ad.entity && <span>Entity: {ad.entity}</span>}
                          <span>Created: {format(new Date(ad.created_at), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="mt-3 text-sm space-y-1">
                          <p>Headlines: {JSON.parse(ad.headlines).filter((h: string) => h).length}/15</p>
                          <p>Descriptions: {JSON.parse(ad.descriptions).filter((d: string) => d).length}/4</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAd(ad);
                          setAdDialogOpen(true);
                        }}
                      >
                        Preview
                      </Button>
                    </div>
                    <Separator className="my-4" />
                    <div onClick={(e) => e.stopPropagation()}>
                      <AdApprovalSection 
                        adId={ad.id} 
                        currentStatus={ad.approval_status || 'pending'}
                        onStatusChange={fetchSavedAds}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {selectedAdIds.length > 0 && (
            <BulkActionsBar
              selectedIds={selectedAdIds}
              onDelete={handleBulkDelete}
              onClearSelection={() => setSelectedAdIds([])}
            />
          )}
        </TabsContent>

        <TabsContent value="elements" className="mt-6">
          <SavedElementsLibrary />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ad Templates</h2>
              <p className="text-muted-foreground mb-6">
                Browse and load pre-made ad templates to quickly create new ads.
              </p>
              <Button onClick={() => setTemplateSelectorOpen(true)}>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {selectedAd && (
        <SavedAdDialog
          open={adDialogOpen}
          onOpenChange={setAdDialogOpen}
          ad={selectedAd}
          onUpdate={() => {
            fetchSavedAds();
            setSelectedAd(null);
          }}
        />
      )}

      <TemplateSelector
        open={templateSelectorOpen}
        onOpenChange={setTemplateSelectorOpen}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}
