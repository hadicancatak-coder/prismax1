import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, ChevronLeft, Copy, BookmarkPlus, Download, Edit } from "lucide-react";
import { SearchAdPreview } from "@/components/ads/SearchAdPreview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateAdStrength, checkCompliance, detectHeadlinePattern, getHeadlinePositionRecommendation } from "@/lib/adQualityScore";
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

interface SearchAdEditorProps {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
  onSave: (adId?: string) => void;
  onCancel: () => void;
}

export default function SearchAdEditor({ ad, adGroup, campaign, entity, onSave, onCancel }: SearchAdEditorProps) {
  const { user } = useAuth();
  const { copy } = useCopyToClipboard();
  const [isEditMode, setIsEditMode] = useState(!ad?.id); // New ads start in edit mode
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

  useEffect(() => {
    if (ad && ad.id) {
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
    updated[index] = !updated[index];
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

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to create ads");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter an ad name");
      return;
    }

    if (!headlines[0]?.trim()) {
      toast.error("Please enter at least one headline");
      return;
    }

    if (!descriptions[0]?.trim()) {
      toast.error("Please enter at least one description");
      return;
    }

    setIsSaving(true);

    try {
      const baseData = {
        name,
        ad_group_id: adGroup.id,
        campaign_name: campaign.name,
        ad_group_name: adGroup.name,
        entity,
        headlines: headlines.filter(h => h.trim()).map((h, i) => {
          const originalIndex = headlines.indexOf(h);
          return dkiEnabled[originalIndex] ? `{Keyword:${h}}` : h;
        }),
        descriptions: descriptions.filter(d => d.trim()),
        sitelinks: sitelinks.filter(s => s.description.trim() || s.link.trim()),
        callouts: callouts.filter(c => c.trim()),
        landing_page: landingPage,
        business_name: businessName,
        language,
        ad_type: "search",
        ad_strength: adStrength.score,
        compliance_issues: complianceIssues.map(issue => ({ ...issue })),
        approval_status: "approved"
      };

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
      toast.error(error.message || "Failed to save ad");
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

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-col lg:flex-row">
      {/* Form Panel */}
      <ResizablePanel defaultSize={50} minSize={40} className="min-h-[50vh] lg:min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 lg:p-6 space-y-6">
            <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                {ad?.id ? "Edit Ad" : "Create New Ad"}
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
                      items={headlines.map((_, i) => `headline-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {headlines.map((headline, index) => (
                          <SortableHeadlineInput
                            key={`headline-${index}`}
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
                        ))}
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
              
              {/* Pattern Distribution Summary */}
              {headlines.filter(h => h.trim()).length > 0 && (
                <div className="p-3 bg-muted/30 rounded-lg space-y-2 mt-2">
                  <div className="text-xs font-medium text-muted-foreground">Headline Pattern Mix:</div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const patterns = headlines
                        .filter(h => h.trim())
                        .map(h => detectHeadlinePattern(h))
                        .filter(p => p.type !== 'none');
                      
                      const counts = patterns.reduce((acc, p) => {
                        acc[p.type] = (acc[p.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const genericCount = headlines.filter(h => h.trim()).filter(h => detectHeadlinePattern(h).type === 'none').length;
                      
                      return (
                        <>
                          {Object.entries(counts).map(([type, count]) => {
                            const pattern = patterns.find(p => p.type === type)!;
                            return (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {pattern.indicator} {type}: {count}
                              </Badge>
                            );
                          })}
                          {genericCount > 0 && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Generic: {genericCount}
                            </Badge>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Descriptions (4 max, 90 chars each)</Label>
              {isEditMode ? (
                <div className="grid grid-cols-1 gap-2">
                  {descriptions.map((description, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
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
              <>
                <div className="space-y-2">
                  <Label>Sitelinks (5 max, 25 chars for description)</Label>
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

                <div className="space-y-2">
                  <Label>Callouts (4 max, 25 chars each)</Label>
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
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    placeholder="Your Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    maxLength={25}
                  />
                </div>
              </>
            )}

            {isEditMode && (
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
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
            </div>
          </ScrollArea>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
