import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, ChevronLeft, Copy, BookmarkPlus, Download, Edit } from "lucide-react";
import { SearchAdPreview } from "@/components/ads/SearchAdPreview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateAdStrength, checkCompliance, detectHeadlinePattern, getHeadlinePositionRecommendation, checkDisplayAdCompliance } from "@/lib/adQualityScore";
import { DisplayAdCreator } from "@/components/ads/DisplayAdCreator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedElementsSelector } from "./SavedElementsSelector";
import { SortableHeadlineInput } from "./SortableHeadlineInput";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UnifiedBestPracticeChecker } from "./UnifiedBestPracticeChecker";
import { AdComplianceChecker } from "../AdComplianceChecker";
import { Plus } from "lucide-react";

interface SearchAdEditorProps {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
  onSave: (adId?: string) => void;
  onCancel: () => void;
  adType?: "search" | "display";
  showHeader?: boolean;
  onFieldChange?: (fields: any) => void;
}

export default function SearchAdEditor({ ad, adGroup, campaign, entity, onSave, onCancel, adType: propAdType, showHeader = true, onFieldChange }: SearchAdEditorProps) {
  console.log('🎨 SearchAdEditor rendering with:', { ad, adGroup, campaign, entity, propAdType });
  const adType = ad?.ad_type || propAdType || "search";
  console.log('📌 adType determined as:', adType);
  const { user } = useAuth();
  const { copy } = useCopyToClipboard();
  const [isEditMode, setIsEditMode] = useState(!ad?.id); // New ads start in edit mode
  console.log('✏️ isEditMode:', isEditMode, 'ad.id:', ad?.id);
  const [previewCombination, setPreviewCombination] = useState(0);
  const [name, setName] = useState("");
  const [headlines, setHeadlines] = useState<string[]>(Array(15).fill(""));
  const [dkiEnabled, setDkiEnabled] = useState<boolean[]>(Array(15).fill(false));
  const [descriptions, setDescriptions] = useState<string[]>(Array(4).fill(""));
  const [sitelinks, setSitelinks] = useState<{description: string; link: string}[]>(Array(5).fill({description: "", link: ""}));
  const [callouts, setCallouts] = useState<string[]>(Array(4).fill(""));
  const [landingPage, setLandingPage] = useState("");
  const [path1, setPath1] = useState("");
  const [path2, setPath2] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [language, setLanguage] = useState("EN");
  const [isSaving, setIsSaving] = useState(false);
  
  // Progressive disclosure state
  const [visibleHeadlineCount, setVisibleHeadlineCount] = useState(3);
  const [visibleDescriptionCount, setVisibleDescriptionCount] = useState(2);

  // Display ad specific state
  const [longHeadline, setLongHeadline] = useState("");
  const [shortHeadlines, setShortHeadlines] = useState<string[]>(Array(5).fill(""));
  const [displayDescriptions, setDisplayDescriptions] = useState<string[]>(Array(5).fill(""));
  const [ctaText, setCtaText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createElementMutation = useMutation({
    mutationFn: async (elementData: any) => {
      const { data, error } = await supabase
        .from('ad_elements')
        .insert(elementData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Element saved to library!");
    },
    onError: (error: any) => {
      toast.error("Failed to save element: " + error.message);
    }
  });

  // Auto-calculate ad strength and compliance
  const adStrength = useMemo(() => {
    return calculateAdStrength(
      headlines.filter(h => h.trim()),
      descriptions.filter(d => d.trim()),
      sitelinks.filter(s => s.description.trim()).map(s => s.description),
      callouts.filter(c => c.trim())
    );
  }, [headlines, descriptions, sitelinks, callouts]);

  const complianceIssues = useMemo(() => {
    return checkCompliance(
      headlines.filter(h => h.trim()),
      descriptions.filter(d => d.trim()),
      sitelinks.filter(s => s.description.trim()).map(s => s.description),
      callouts.filter(c => c.trim()),
      entity
    );
  }, [headlines, descriptions, sitelinks, callouts, entity]);

  // Display ad compliance
  const displayCompliance = useMemo(() => {
    if (adType === "display") {
      return checkDisplayAdCompliance(
        longHeadline,
        shortHeadlines,
        displayDescriptions,
        ctaText,
        entity
      );
    }
    return [];
  }, [adType, longHeadline, shortHeadlines, displayDescriptions, ctaText, entity]);

  useEffect(() => {
    if (ad) {
      setName(ad.name || "");
      setHeadlines([...(ad.headlines || []), ...Array(15).fill("")].slice(0, 15));
      setDescriptions([...(ad.descriptions || []), ...Array(4).fill("")].slice(0, 4));
      
      // Load sitelinks with backward compatibility
      if (ad.sitelinks && Array.isArray(ad.sitelinks)) {
        const loadedSitelinks = ad.sitelinks.map((s: any) => ({
          description: s.description || s.text || "",
          link: s.link || s.url || ""
        }));
        setSitelinks([
          ...loadedSitelinks,
          ...Array(Math.max(0, 5 - loadedSitelinks.length)).fill({description: "", link: ""})
        ]);
      }
      
      setCallouts([...(ad.callouts || []), ...Array(4).fill("")].slice(0, 4));
      setLandingPage(ad.landing_page || "");
      setBusinessName(ad.business_name || "");
      setLanguage(ad.language || "EN");
      
      // Load display-specific fields
      if (ad.ad_type === "display") {
        setLongHeadline(ad.long_headline || "");
        setShortHeadlines([...(ad.short_headlines || []), ...Array(5).fill("")].slice(0, 5));
        setDisplayDescriptions([...(ad.descriptions || []), ...Array(5).fill("")].slice(0, 5));
        setCtaText(ad.cta_text || "");
      }
    } else {
      setLanguage(campaign?.languages?.[0] || "EN");
    }
  }, [ad, campaign]);

  const updateHeadline = (index: number, value: string) => {
    const newHeadlines = [...headlines];
    newHeadlines[index] = value;
    setHeadlines(newHeadlines);
  };

  const toggleDKI = (index: number) => {
    const updated = [...dkiEnabled];
    const newHeadlines = [...headlines];
    
    if (!updated[index]) {
      // Enabling DKI - insert {KW} if not already present
      if (!newHeadlines[index].includes('{KW}') && 
          !newHeadlines[index].includes('{kw}') && 
          !newHeadlines[index].includes('{Kw}')) {
        // If headline is empty, just add {KW}
        // Otherwise, add it at the beginning
        newHeadlines[index] = newHeadlines[index].trim() 
          ? `{KW} ${newHeadlines[index]}` 
          : '{KW}';
        setHeadlines(newHeadlines);
      }
      updated[index] = true;
    } else {
      // Disabling DKI - remove {KW} placeholders
      newHeadlines[index] = newHeadlines[index]
        .replace(/{KW}/gi, '')
        .replace(/{kw}/gi, '')
        .replace(/{Kw}/gi, '')
        .trim();
      setHeadlines(newHeadlines);
      updated[index] = false;
    }
    
    setDkiEnabled(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = headlines.findIndex((_, i) => `headline-${i}` === active.id);
      const newIndex = headlines.findIndex((_, i) => `headline-${i}` === over.id);
      
      setHeadlines(arrayMove(headlines, oldIndex, newIndex));
      setDkiEnabled(arrayMove(dkiEnabled, oldIndex, newIndex));
    }
  };

  const updateDescription = (index: number, value: string) => {
    const newDescriptions = [...descriptions];
    newDescriptions[index] = value;
    setDescriptions(newDescriptions);
  };

  const updateSitelink = (index: number, field: 'description' | 'link', value: string) => {
    const newSitelinks = [...sitelinks];
    newSitelinks[index] = { ...newSitelinks[index], [field]: value };
    setSitelinks(newSitelinks);
  };

  const updateCallout = (index: number, value: string) => {
    const newCallouts = [...callouts];
    newCallouts[index] = value;
    setCallouts(newCallouts);
  };

  const handleSaveElement = (type: 'headline' | 'description' | 'sitelink' | 'callout', content: string | {description: string; link: string}) => {
    if (!user?.id) {
      toast.error("You must be logged in to save elements");
      return;
    }

    let elementContent = content;
    if (type === 'sitelink' && typeof content === 'object') {
      if (!content.description && !content.link) {
        toast.error("Sitelink must have description or link");
        return;
      }
      elementContent = content;
    } else if (typeof content === 'string' && !content.trim()) {
      toast.error("Cannot save empty element");
      return;
    }

    createElementMutation.mutate({
      element_type: type,
      content: elementContent,
      created_by: user.id,
      entity: entity,
      language: language,
      google_status: 'approved',
      use_count: 0
    });
  };

  const handleCopyAd = () => {
    const copyData = {
      name: `${name} (Copy)`,
      headlines,
      descriptions,
      sitelinks,
      callouts,
      landingPage,
      businessName,
      language
    };
    
    setName(copyData.name);
    setHeadlines(copyData.headlines);
    setDescriptions(copyData.descriptions);
    setSitelinks(copyData.sitelinks);
    setCallouts(copyData.callouts);
    setLandingPage(copyData.landingPage);
    setBusinessName(copyData.businessName);
    setLanguage(copyData.language);
    
    toast.success("Ad copied! You can now edit and save as a new ad.");
  };

  // Field Actions Component
  interface FieldActionsProps {
    value: string;
    elementType: 'headline' | 'description' | 'sitelink' | 'callout';
    onSelect: (content: string) => void;
    onSave: () => void;
    isEmpty: boolean;
  }

  const FieldActions = ({ value, elementType, onSelect, onSave, isEmpty }: FieldActionsProps) => {
    return (
      <div className="flex gap-1">
        <SavedElementsSelector
          elementType={elementType}
          entity={entity}
          language={language}
          onSelect={onSelect}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Use saved element"
            >
              <Download className="h-4 w-4" />
            </Button>
          }
        />
        
        {!isEmpty && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onSave}
              title="Save to library"
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => copy(value)}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    );
  };

  const handleSave = async (silent: boolean = false) => {
    if (!user?.id) {
      if (!silent) toast.error("You must be logged in to create ads");
      return;
    }

    if (!name.trim()) {
      if (!silent) toast.error("Please enter an ad name");
      return;
    }

    if (!headlines[0]?.trim()) {
      if (!silent) toast.error("Please enter at least one headline");
      return;
    }

    if (!descriptions[0]?.trim()) {
      if (!silent) toast.error("Please enter at least one description");
      return;
    }

    setIsSaving(true);

    try {
      const baseData: any = {
        name,
        ad_group_id: adGroup.id,
        campaign_name: campaign.name,
        ad_group_name: adGroup.name,
        entity,
        landing_page: landingPage,
        business_name: businessName,
        language,
        ad_type: adType,
        approval_status: "approved"
      };

      if (adType === "display") {
        // Display ad specific data
        baseData.long_headline = longHeadline;
        baseData.short_headlines = shortHeadlines.filter(h => h.trim());
        baseData.descriptions = displayDescriptions.filter(d => d.trim());
        baseData.cta_text = ctaText;
        baseData.ad_strength = 0;
        baseData.compliance_issues = displayCompliance.map(issue => ({ message: issue }));
      } else {
        // Search ad specific data
        baseData.headlines = headlines.filter(h => h.trim()).map((h, i) => {
          const originalIndex = headlines.indexOf(h);
          return dkiEnabled[originalIndex] ? `{Keyword:${h}}` : h;
        });
        baseData.descriptions = descriptions.filter(d => d.trim());
        baseData.sitelinks = sitelinks.filter(s => s.description.trim() || s.link.trim());
        baseData.callouts = callouts.filter(c => c.trim());
        baseData.ad_strength = adStrength.score;
        baseData.compliance_issues = complianceIssues.map(issue => ({ ...issue }));
      }

      if (ad?.id) {
        // Get current auth user directly to ensure correct ID
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error('Not authenticated');
        }
        
        const { error } = await supabase
          .from("ads")
          .update({
            ...baseData,
            updated_by: authUser.id
          })
          .eq("id", ad.id);
          
        if (error) {
          console.error('Ad update error:', error);
          throw error;
        }
        
        toast.success("Ad updated successfully");
        onSave(ad.id);
      } else {
        const { data, error } = await supabase
          .from("ads")
          .insert({
            ...baseData,
            created_by: user.id
          })
          .select()
          .single();
        if (error) throw error;
        toast.success("Ad created successfully");
        onSave(data.id);
      }
    } catch (error: any) {
      console.error('Save ad error:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to save ad";
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Network error: Unable to connect to server. Please check your internet connection and try again.";
      } else if (error.message?.includes('duplicate key')) {
        errorMessage = "An ad with this name already exists. Please use a different name.";
      } else if (error.code === '23505') {
        errorMessage = "Duplicate entry detected. Please modify your ad details.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const generatePreviewCombinations = () => {
    const validHeadlines = headlines.filter(h => h.trim());
    const validDescriptions = descriptions.filter(d => d.trim());
    
    if (validHeadlines.length === 0) {
      return [{
        headlines: [],
        descriptions: validDescriptions.slice(0, 2)
      }];
    }
    
    // Helper to get random unique elements
    const getRandomElements = (arr: string[], count: number) => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, arr.length));
    };
    
    const combinations = [];
    const maxCombinations = 10;
    
    // Generate up to 10 unique combinations
    for (let i = 0; i < maxCombinations; i++) {
      const comboHeadlines = getRandomElements(validHeadlines, 3);
      const comboDescriptions = getRandomElements(validDescriptions, 2);
      
      combinations.push({
        headlines: comboHeadlines,
        descriptions: comboDescriptions
      });
    }
    
    // Remove duplicate combinations
    const uniqueCombinations = combinations.filter((combo, index, self) => {
      const key = combo.headlines.join('|') + '::' + combo.descriptions.join('|');
      return index === self.findIndex(c => 
        (c.headlines.join('|') + '::' + c.descriptions.join('|')) === key
      );
    });
    
    return uniqueCombinations.length > 0 ? uniqueCombinations : [{
      headlines: validHeadlines.slice(0, 3),
      descriptions: validDescriptions.slice(0, 2)
    }];
  };

  const combinations = generatePreviewCombinations();
  const currentCombination = combinations[previewCombination] || {
    headlines: headlines.filter(h => h),
    descriptions: descriptions.filter(d => d)
  };

  // Display ad editing not yet supported with full UI - show basic message
  if (adType === "display") {
    return (
      <div className="h-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">
            {ad?.id ? "Edit Display Ad" : "Create Display Ad"}
          </h2>
          <Button variant="ghost" onClick={onCancel}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {displayCompliance.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1">
                {displayCompliance.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <DisplayAdCreator
          businessName={businessName}
          setBusinessName={setBusinessName}
          longHeadline={longHeadline}
          setLongHeadline={setLongHeadline}
          shortHeadlines={shortHeadlines}
          setShortHeadlines={setShortHeadlines}
          descriptions={displayDescriptions}
          setDescriptions={setDisplayDescriptions}
          ctaText={ctaText}
          setCtaText={setCtaText}
          landingPage={landingPage}
          setLandingPage={setLandingPage}
          adEntity={entity}
        />

        <div className="flex gap-2 mt-6">
          <Button onClick={() => handleSave(false)} disabled={isSaving || !ctaText}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : ad?.id ? "Update Ad" : "Create Ad"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full flex-col lg:flex-row">
      {/* Form Panel */}
      <ResizablePanel defaultSize={50} minSize={40} className="min-h-[50vh] lg:min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 lg:p-6 space-y-6">
            <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                {ad?.id ? "Edit Search Ad" : "Create Search Ad"}
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {!isEditMode ? (
                  <Button variant="default" size="sm" onClick={() => setIsEditMode(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)}>
                    Cancel Edit
                  </Button>
                )}
                {ad?.id && (
                  <Button variant="outline" size="sm" onClick={handleCopyAd}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Ad
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal text-muted-foreground hover:text-primary"
                onClick={onCancel}
              >
                {entity}
              </Button>
              <span className="text-muted-foreground">›</span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal text-muted-foreground hover:text-primary"
                onClick={onCancel}
              >
                {campaign.name}
              </Button>
              <span className="text-muted-foreground">›</span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal text-muted-foreground hover:text-primary"
                onClick={onCancel}
              >
                {adGroup.name}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ad-name">Ad Name *</Label>
              {isEditMode ? (
                <Input
                  id="ad-name"
                  placeholder="e.g., Summer Sale - Main Ad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : (
                <div className="text-xl font-semibold">{name || "Untitled Ad"}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language *</Label>
              {isEditMode ? (
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EN">English</SelectItem>
                    <SelectItem value="AR">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm">{language === "EN" ? "English" : "Arabic"}</div>
              )}
            </div>

              <div className="space-y-2">
                <Label>Headlines (15 max, 30 chars each) - Drag to reorder</Label>
                {isEditMode ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={headlines.slice(0, visibleHeadlineCount).map((_, i) => `headline-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {headlines.slice(0, visibleHeadlineCount).map((headline, index) => (
                           <div key={index} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`headline-${index}`}>
                                Headline {index + 1}
                                <span className={
                                  headline.length < 24 ? "ml-2 text-success" :
                                  headline.length < 29 ? "ml-2 text-warning" :
                                  "ml-2 text-destructive"
                                }>
                                  {headline.length}/30
                                </span>
                              </Label>
                            </div>
                            <SortableHeadlineInput
                              id={`headline-${index}`}
                              index={index}
                              headline={headline}
                              isDkiEnabled={dkiEnabled[index]}
                              onUpdate={(value) => updateHeadline(index, value)}
                              onToggleDki={() => toggleDKI(index)}
                              renderActions={() => (
                                <FieldActions
                                  value={headline}
                                  elementType="headline"
                                  onSelect={(content) => updateHeadline(index, content)}
                                  onSave={() => handleSaveElement('headline', headline)}
                                  isEmpty={!headline.trim()}
                                />
                              )}
                            />
                          </div>
                        ))}
                        {visibleHeadlineCount < 15 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setVisibleHeadlineCount(Math.min(visibleHeadlineCount + 3, 15))}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add More Headlines ({15 - visibleHeadlineCount} remaining)
                          </Button>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
              ) : (
                <div className="space-y-1">
                  {headlines.filter(h => h.trim()).map((headline, index) => {
                    const pattern = detectHeadlinePattern(headline);
                    const hasPattern = pattern.type !== 'none';
                    
                    return (
                      <div 
                        key={index} 
                        className={`text-sm p-2 rounded flex items-center gap-2 ${
                          hasPattern ? 'bg-yellow-50/50 border border-yellow-200' : 'bg-muted/30'
                        }`}
                      >
                        <span className="flex-1">• {headline}</span>
                        {hasPattern && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-help bg-yellow-100 border-yellow-400 text-yellow-900 shrink-0"
                                >
                                  {pattern.indicator} +{pattern.boost}%
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">{pattern.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    );
                  })}
                  {headlines.filter(h => h.trim()).length === 0 && (
                    <div className="text-sm text-muted-foreground">No headlines</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Descriptions (4 max, 90 chars each)</Label>
              {isEditMode ? (
                <div className="grid grid-cols-1 gap-3">
                  {descriptions.map((description, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`description-${index}`}>
                          Description {index + 1}
                          <span className={
                            description.length < 72 ? "ml-2 text-success" :
                            description.length < 86 ? "ml-2 text-warning" :
                            "ml-2 text-destructive"
                          }>
                            {description.length}/90
                          </span>
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id={`description-${index}`}
                          placeholder={`Description ${index + 1}${index < 2 ? ' *' : ''}`}
                          value={description}
                          onChange={(e) => updateDescription(index, e.target.value)}
                          maxLength={90}
                          className="flex-1"
                        />
                        <FieldActions
                          value={description}
                          elementType="description"
                          onSelect={(content) => updateDescription(index, content)}
                          onSave={() => handleSaveElement('description', description)}
                          isEmpty={!description.trim()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {descriptions.filter(d => d.trim()).map((description, index) => (
                    <div key={index} className="text-sm p-2 bg-muted/30 rounded">• {description}</div>
                  ))}
                  {descriptions.filter(d => d.trim()).length === 0 && (
                    <div className="text-sm text-muted-foreground">No descriptions</div>
                  )}
                </div>
              )}
            </div>


            {isEditMode && (
              <Accordion type="multiple" defaultValue={[]} className="w-full">
                <AccordionItem value="sitelinks">
                  <AccordionTrigger className="text-body-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span>Sitelinks</span>
                      <Badge variant="secondary" className="text-xs">
                        {sitelinks.filter(s => s.description.trim()).length}/5
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">5 max, 25 chars for description</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {sitelinks.map((sitelink, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="flex-1 space-y-1">
                              <Input
                                placeholder={`Link description ${index + 1}`}
                                value={sitelink.description}
                                onChange={(e) => updateSitelink(index, 'description', e.target.value)}
                                maxLength={25}
                              />
                              <Input
                                placeholder={`Link URL ${index + 1}`}
                                value={sitelink.link}
                                onChange={(e) => updateSitelink(index, 'link', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            <FieldActions
                              value={sitelink.description}
                              elementType="sitelink"
                              onSelect={(content) => updateSitelink(index, 'description', content)}
                              onSave={() => handleSaveElement('sitelink', sitelink)}
                              isEmpty={!sitelink.description.trim() && !sitelink.link.trim()}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="callouts">
                  <AccordionTrigger className="text-body-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span>Callouts</span>
                      <Badge variant="secondary" className="text-xs">
                        {callouts.filter(c => c.trim()).length}/4
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">4 max, 25 chars each</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {callouts.map((callout, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Callout ${index + 1} (e.g., "24/7 Support")`}
                              value={callout}
                              onChange={(e) => updateCallout(index, e.target.value)}
                              maxLength={25}
                              className="flex-1"
                            />
                            <FieldActions
                              value={callout}
                              elementType="callout"
                              onSelect={(content) => updateCallout(index, content)}
                              onSave={() => handleSaveElement('callout', callout)}
                              isEmpty={!callout.trim()}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="paths">
                  <AccordionTrigger className="text-body-sm font-medium">
                    Paths & Extensions
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="landing-page">Final URL</Label>
                        <Input
                          id="landing-page"
                          type="url"
                          placeholder="https://example.com"
                          value={landingPage}
                          onChange={(e) => setLandingPage(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="path1">Path 1 (Max 15 chars)</Label>
                          <Input
                            id="path1"
                            placeholder="path1"
                            value={path1}
                            onChange={(e) => setPath1(e.target.value)}
                            maxLength={15}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="path2">Path 2 (Max 15 chars)</Label>
                          <Input
                            id="path2"
                            placeholder="path2"
                            value={path2}
                            onChange={(e) => setPath2(e.target.value)}
                            maxLength={15}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="business-name">Business Name (optional)</Label>
                        <Input
                          id="business-name"
                          placeholder="Your Business Name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}


        {/* Unified Best Practice Checker - Removed from left, will be on right */}

            {isEditMode && (
              <Button onClick={() => handleSave(false)} disabled={isSaving} className="w-full">
                {isSaving && <span className="mr-2">⏳</span>}
                <Save className="mr-2 h-4 w-4" />
                {ad?.id ? "Update Ad" : "Create Ad"}
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle className="hidden lg:flex" />

      {/* Preview Panel */}
      <ResizablePanel defaultSize={50} minSize={40} className="min-h-[50vh] lg:min-h-0">
        <div className="h-full border-l bg-muted/30 flex flex-col">
          <div className="sticky top-0 z-10 p-3 border-b bg-background">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Live Preview</span>
              <Badge variant="outline" className="text-xs">
                RSA Combination {previewCombination + 1}/{combinations.length}
              </Badge>
            </div>
            
            {combinations.length > 1 && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setPreviewCombination(prev => 
                    prev === 0 ? combinations.length - 1 : prev - 1
                  )}
                >
                  ← Previous
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setPreviewCombination(prev => 
                    (prev + 1) % combinations.length
                  )}
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
          
          <ScrollArea className="flex-1 p-4 lg:p-6">
            <div className="space-y-6">
              <div>
                <SearchAdPreview
                  headlines={currentCombination.headlines}
                  descriptions={currentCombination.descriptions}
                  landingPage={landingPage}
                  businessName={businessName}
                  sitelinks={sitelinks.filter(s => s.description || s.link)}
                  callouts={callouts.filter(c => c)}
                />
              </div>

              {/* Ad Strength */}
              <div className="space-y-2 p-4 border rounded-lg bg-background">
                <div className="flex items-center justify-between">
                  <Label>Ad Strength</Label>
                  <Badge variant={adStrength.strength === 'excellent' ? 'default' : adStrength.strength === 'good' ? 'secondary' : 'outline'}>
                    {adStrength.strength.toUpperCase()} ({adStrength.score}/100)
                  </Badge>
                </div>
                <Progress value={adStrength.score} className="h-2" />
                {adStrength.suggestions.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    {adStrength.suggestions.slice(0, 3).map((suggestion, i) => (
                      <div key={i}>• {suggestion}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compliance Issues */}
              {complianceIssues.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="font-semibold mb-1">Compliance Issues:</div>
                    {complianceIssues.map((issue, i) => (
                      <div key={i} className="text-sm">• {issue.message}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Enhanced Compliance Check with Entity Rules */}
              {(headlines.some(h => h.trim()) || descriptions.some(d => d.trim())) && (
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="text-body-sm font-semibold mb-3 text-foreground">
                    Compliance Check
                  </h4>
                  <AdComplianceChecker
                    headlines={headlines.filter(h => h.trim())}
                    descriptions={descriptions.filter(d => d.trim())}
                    sitelinks={sitelinks.filter(s => s.description).map(s => s.description)}
                    callouts={callouts.filter(c => c.trim())}
                    entity={entity}
                  />
                </div>
              )}

              {/* Unified Best Practice Checker - BELOW PREVIEWS */}
              {isEditMode && (
                <div className="border-t border-border pt-md mt-md">
                  <UnifiedBestPracticeChecker
                    headlines={headlines}
                    descriptions={descriptions}
                    entity={entity}
                    onHeadlinesUpdate={setHeadlines}
                    dkiEnabled={dkiEnabled}
                    onDkiToggle={(index, enabled) => {
                      const newDkiEnabled = [...dkiEnabled];
                      newDkiEnabled[index] = enabled;
                      setDkiEnabled(newDkiEnabled);
                    }}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
