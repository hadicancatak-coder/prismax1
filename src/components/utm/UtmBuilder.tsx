import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SimpleMultiSelect } from "./SimpleMultiSelect";
import { AddCampaignDialog } from "./AddCampaignDialog";
import { SaveAsTemplateDialog } from "./SaveAsTemplateDialog";
import { useCreateUtmLink, useBulkCreateUtmLinks } from "@/hooks/useUtmLinks";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { useUtmTemplates } from "@/hooks/useUtmTemplates";
import { calculateUtmMedium, generateUtmCampaign, formatMonthYearReadable, buildUtmUrl, detectEntityFromUrl, generateStaticLpVariants, generateDynamicLpVariants, generateMauritiusLpVariants } from "@/lib/utmHelpers";
import { ENTITIES, TEAMS } from "@/lib/constants";
import { Copy, Save, AlertCircle, Plus, CheckCircle2, Zap, Settings2, Maximize2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UtmBuilderProps {
  onSave?: () => void;
}

const LINK_PURPOSES = [
  { value: "AO", label: "AO" },
  { value: "Seminar", label: "Seminar" },
  { value: "Webinar", label: "Webinar" },
  { value: "Education", label: "Education" },
];

export const UtmBuilder = ({ onSave }: UtmBuilderProps) => {
  // Mode state - persisted to localStorage
  const [mode, setMode] = useState<'template' | 'custom'>(() => {
    return (localStorage.getItem('utmBuilderMode') as 'template' | 'custom') || 'template';
  });

  const [linkName, setLinkName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("AO");
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [utmContent, setUtmContent] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Handle mode change
  const handleModeChange = (newMode: 'template' | 'custom') => {
    setMode(newMode);
    localStorage.setItem('utmBuilderMode', newMode);
  };
  
  // Auto-detected values
  const [detectedEntity, setDetectedEntity] = useState<string | null>(null);
  const [lpType, setLpType] = useState<'static' | 'mauritius' | 'dynamic' | null>(null);
  const [dynamicLanguage, setDynamicLanguage] = useState<'EN' | 'AR'>('EN');
  
  const [autoUtmSource, setAutoUtmSource] = useState("");
  const [autoUtmMedium, setAutoUtmMedium] = useState("");
  const [autoUtmCampaign, setAutoUtmCampaign] = useState("");
  const [autoMonthYear, setAutoMonthYear] = useState("");
  const [fullUrl, setFullUrl] = useState("");

  const createUtmLink = useCreateUtmLink();
  const bulkCreateUtmLinks = useBulkCreateUtmLinks();
  const { data: campaigns = [], isLoading: loadingCampaigns } = useUtmCampaigns();
  const { data: platforms = [], isLoading: loadingPlatforms } = useUtmPlatforms();
  const { data: templates = [] } = useUtmTemplates();

  // Auto-detect entity and LP type from URL
  useEffect(() => {
    if (baseUrl) {
      const detection = detectEntityFromUrl(baseUrl);
      setLpType(detection.lpType);
      setDetectedEntity(detection.entity);
      
      // Auto-set entity based on detection
      if (detection.entity && !selectedEntities.includes(detection.entity)) {
        setSelectedEntities([detection.entity]);
      }
    }
  }, [baseUrl]);

  // Auto-populate base URL when campaign selected (Template mode only)
  useEffect(() => {
    if (mode === 'template' && selectedCampaign && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.name === selectedCampaign);
      if (campaign?.landing_page) {
        setBaseUrl(campaign.landing_page);
      }
    }
  }, [selectedCampaign, campaigns, mode]);

  // Auto-calculate UTM parameters
  useEffect(() => {
    if (selectedPlatform) {
      setAutoUtmSource(selectedPlatform.toLowerCase());
      setAutoUtmMedium(calculateUtmMedium(selectedPlatform));
    }

    if (selectedCampaign) {
      const campaign = generateUtmCampaign(selectedCampaign);
      setAutoUtmCampaign(campaign);
    }

    setAutoMonthYear(formatMonthYearReadable());
  }, [selectedCampaign, selectedPlatform]);

  // Build full URL
  useEffect(() => {
    if (baseUrl && autoUtmSource && autoUtmMedium && autoUtmCampaign) {
      const url = buildUtmUrl({
        baseUrl,
        utmSource: autoUtmSource,
        utmMedium: autoUtmMedium,
        utmCampaign: autoUtmCampaign,
        utmContent: utmContent || undefined,
        utmTerm: utmTerm || undefined,
        dynamicLanguage: lpType === 'dynamic' ? dynamicLanguage : undefined,
      });
      setFullUrl(url);
    } else {
      setFullUrl("");
    }
  }, [baseUrl, autoUtmSource, autoUtmMedium, autoUtmCampaign, utmContent, utmTerm, lpType, dynamicLanguage]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success("URL copied to clipboard!");
  };

  const handleSave = async () => {
    if (!baseUrl.trim()) {
      toast.error("Please enter a base URL");
      return;
    }

    if (!selectedCampaign) {
      toast.error("Please select a campaign");
      return;
    }

    if (!selectedPlatform) {
      toast.error("Please select a platform");
      return;
    }

    if (lpType === 'dynamic' && !dynamicLanguage) {
      toast.error("Please select a language for Dynamic LP");
      return;
    }

    try {
      await createUtmLink.mutateAsync({
        name: linkName || `${selectedCampaign} ${selectedPlatform} ${detectedEntity || 'Dynamic'} ${autoMonthYear}`,
        base_url: baseUrl,
        campaign_name: selectedCampaign,
        platform: selectedPlatform,
        link_purpose: selectedPurpose || undefined,
        entity: selectedEntities.length > 0 ? selectedEntities : undefined,
        teams: selectedTeams.length > 0 ? selectedTeams : undefined,
        utm_source: autoUtmSource,
        utm_medium: autoUtmMedium,
        utm_campaign: autoUtmCampaign,
        utm_content: utmContent || undefined,
        utm_term: utmTerm || undefined,
        full_url: fullUrl,
        month_year: autoMonthYear,
        notes: notes || undefined,
        lp_type: lpType,
        dynamic_language: lpType === 'dynamic' ? dynamicLanguage : undefined,
        expansion_group_id: undefined,
      });

      // Reset form
      setLinkName("");
      setBaseUrl("");
      setSelectedCampaign("");
      setSelectedPlatform("");
      setSelectedPurpose("AO");
      setSelectedEntities([]);
      setSelectedTeams([]);
      setUtmContent("");
      setUtmTerm("");
      setNotes("");
      setDynamicLanguage('EN');
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isFormValid = baseUrl && selectedCampaign && selectedPlatform && (lpType === 'dynamic' ? !!dynamicLanguage : true);

  // Load template when selected
  useEffect(() => {
    if (selectedTemplate && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setAutoUtmSource(template.utm_source);
        setAutoUtmMedium(template.utm_medium);
        setAutoUtmCampaign(template.utm_campaign);
        if (template.utm_content) setUtmContent(template.utm_content);
        if (template.utm_term) setUtmTerm(template.utm_term);
        if (template.entity) setSelectedEntities([template.entity]);
        toast.success(`Loaded template: ${template.name}`);
      }
    }
  }, [selectedTemplate, templates]);

  const handleExpand = async () => {
    if (!isFormValid) return;

    const utmParams = {
      utmSource: autoUtmSource,
      utmMedium: autoUtmMedium,
      utmCampaign: autoUtmCampaign,
      utmContent: utmContent || undefined,
      utmTerm: utmTerm || undefined,
    };

    let variants: Array<{ entity?: string; language?: string; url: string }> = [];

    if (lpType === 'static') {
      variants = generateStaticLpVariants(baseUrl, utmParams);
      toast.info(`Generating ${variants.length} links for all static entities (EN + AR)...`);
    } else if (lpType === 'dynamic') {
      variants = generateDynamicLpVariants(baseUrl, utmParams);
      toast.info('Generating 2 links (EN + AR) for dynamic LP...');
    } else if (lpType === 'mauritius') {
      variants = generateMauritiusLpVariants(baseUrl, utmParams);
      toast.info('Generating 2 links (EN + AR) for Mauritius LP...');
    }

    if (variants.length === 0) {
      toast.error('No variants to generate');
      return;
    }

    try {
      // Generate unique group ID for this expansion
      const expansionGroupId = crypto.randomUUID();
      
      const bulkLinks = variants.map((variant) => ({
        name: variant.language 
          ? `${selectedCampaign} ${selectedPlatform} ${variant.entity || ''} ${variant.language} ${autoMonthYear}`.trim().replace(/\s+/g, ' ')
          : `${selectedCampaign} ${selectedPlatform} ${variant.entity || variant.language} ${autoMonthYear}`,
        base_url: baseUrl,
        campaign_name: selectedCampaign,
        platform: selectedPlatform,
        link_purpose: selectedPurpose || undefined,
        entity: variant.entity ? [variant.entity] : undefined,
        teams: selectedTeams.length > 0 ? selectedTeams : undefined,
        utm_source: autoUtmSource,
        utm_medium: autoUtmMedium,
        utm_campaign: autoUtmCampaign,
        utm_content: utmContent || undefined,
        utm_term: utmTerm || undefined,
        full_url: variant.url,
        month_year: autoMonthYear,
        notes: notes || undefined,
        lp_type: lpType,
        dynamic_language: (variant.language as 'EN' | 'AR') || undefined,
        expansion_group_id: expansionGroupId,
      }));

      await bulkCreateUtmLinks.mutateAsync(bulkLinks);
      
      // ✅ Stay on Builder tab - DO NOT call onSave()
      // ✅ Keep form fields intact - DO NOT reset
      
      toast.success(
        `✅ Created ${variants.length} UTM links successfully! You can continue editing or view them in the Links tab.`,
        { duration: 5000 }
      );
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getExpandTooltip = () => {
    if (lpType === 'static') {
      const variants = generateStaticLpVariants(baseUrl, {
        utmSource: autoUtmSource,
        utmMedium: autoUtmMedium,
        utmCampaign: autoUtmCampaign,
      });
      return `Generate ${variants.length} links for all static entities (EN + AR each)`;
    } else if (lpType === 'dynamic') {
      return 'Generate 2 links (EN + AR)';
    } else if (lpType === 'mauritius') {
      return 'Generate 2 links (EN + AR)';
    }
    return 'Expand to multiple links';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>UTM Link Builder</CardTitle>
              <CardDescription>
                Create a new UTM-tagged link with auto-generated parameters
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {templates.length > 0 && (
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="w-48">
                    <FileText className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Load template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Tabs value={mode} onValueChange={(v) => handleModeChange(v as 'template' | 'custom')}>
                <TabsList>
                  <TabsTrigger value="template" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Quick
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="text-xs">
                    <Settings2 className="h-3 w-3 mr-1" />
                    Custom
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign and Platform Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign *</Label>
              <div className="flex gap-2">
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.name}>
                        {campaign.name}
                        {campaign.usage_count > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">({campaign.usage_count})</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddCampaign(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.name}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
                <SelectTrigger id="purpose">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {LINK_PURPOSES.map((purpose) => (
                    <SelectItem key={purpose.value} value={purpose.value}>
                      {purpose.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Base URL - Custom mode only shows input, Template mode shows auto-filled */}
          {mode === 'custom' ? (
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL *</Label>
              <Input
                id="base-url"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://cfi.trade/jo/open-account"
              />
              {baseUrl && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {detectedEntity && (
                    <Badge variant="secondary">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {detectedEntity}
                    </Badge>
                  )}
                  <Badge variant="outline">{lpType === 'static' ? 'Static LP' : lpType === 'mauritius' ? 'Mauritius LP' : 'Dynamic LP'}</Badge>
                  {autoUtmMedium && (
                    <Badge variant="outline">utm_medium: {autoUtmMedium}</Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            baseUrl && (
              <div className="space-y-2">
                <Label>Landing Page (auto-filled)</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="font-mono text-sm flex-1 break-all">{baseUrl}</span>
                  <div className="flex gap-2">
                    {detectedEntity && (
                      <Badge variant="secondary" className="text-xs">
                        {detectedEntity}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{lpType === 'static' ? 'Static' : lpType === 'mauritius' ? 'Mauritius' : 'Dynamic'}</Badge>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Language Selector - Only for Dynamic LPs */}
          {lpType === 'dynamic' && baseUrl && (
            <div className="space-y-2">
              <Label>Language for Dynamic LP *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={dynamicLanguage === 'EN' ? 'default' : 'outline'}
                  onClick={() => setDynamicLanguage('EN')}
                >
                  EN
                </Button>
                <Button
                  type="button"
                  variant={dynamicLanguage === 'AR' ? 'default' : 'outline'}
                  onClick={() => setDynamicLanguage('AR')}
                >
                  AR
                </Button>
              </div>
            </div>
          )}

          {/* Custom mode - show all fields */}
          {mode === 'custom' && (
            <>
              {/* Teams */}
              <div className="space-y-2">
                <Label>Teams</Label>
                <SimpleMultiSelect
                  options={TEAMS.map(team => ({ value: team, label: team }))}
                  selected={selectedTeams}
                  onChange={setSelectedTeams}
                  placeholder="Select teams"
                />
              </div>

              {/* Entity Override */}
              {lpType !== 'dynamic' && (
                <div className="space-y-2">
                  <Label>Entity {detectedEntity && '(Auto-detected)'}</Label>
                  {lpType === 'static' ? (
                    <Select value={selectedEntities[0] || ''} onValueChange={(val) => setSelectedEntities([val])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select one entity" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITIES.map((entity) => (
                          <SelectItem key={entity} value={entity}>
                            {entity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <SimpleMultiSelect
                      options={ENTITIES.map(entity => ({ value: entity, label: entity }))}
                      selected={selectedEntities}
                      onChange={setSelectedEntities}
                      placeholder="Select entities"
                    />
                  )}
                </div>
              )}

              {/* Link Name */}
              <div className="space-y-2">
                <Label htmlFor="link-name">Link Name (optional)</Label>
                <Input
                  id="link-name"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder={`Auto: ${selectedCampaign} ${selectedPlatform} ${detectedEntity || 'Dynamic'} ${autoMonthYear}`}
                />
              </div>
            </>
          )}

          {/* UTM Content Field - Always visible in both modes */}
          <div className="space-y-2">
            <Label htmlFor="utm-content">UTM Content</Label>
            <Input
              id="utm-content"
              value={utmContent}
              onChange={(e) => setUtmContent(e.target.value)}
              placeholder="e.g., banner-top, sidebar-cta"
            />
          </div>

          {/* Auto-Generated Campaign */}
          {autoUtmCampaign && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Auto-generated:</strong> utm_campaign = {autoUtmCampaign}
              </AlertDescription>
            </Alert>
          )}

          {/* Optional Fields - Only in Custom mode, collapsed */}
          {mode === 'custom' && (
            <details className="space-y-4">
              <summary className="cursor-pointer font-medium">Optional Fields</summary>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="utm-term">UTM Term</Label>
                  <Input
                    id="utm-term"
                    value={utmTerm}
                    onChange={(e) => setUtmTerm(e.target.value)}
                    placeholder="e.g., forex+trading"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes about this link"
                    rows={3}
                  />
                </div>
              </div>
            </details>
          )}

          {/* Preview */}
          {fullUrl && (
            <div className="space-y-3">
              <Label>Preview</Label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {fullUrl}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Primary Actions */}
            <div className="flex gap-2 flex-1">
              <Button onClick={handleSave} disabled={!isFormValid} size="lg" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Link
              </Button>
              {fullUrl && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleExpand} disabled={!isFormValid} variant="default" size="lg" className="flex-1">
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Expand ({lpType === 'static' ? (ENTITIES.length * 2) : 2})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getExpandTooltip()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {/* Secondary Actions */}
            <div className="flex gap-2">
              {fullUrl && (
                <Button onClick={handleCopy} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={() => setShowSaveTemplate(true)} disabled={!isFormValid} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddCampaignDialog open={showAddCampaign} onOpenChange={setShowAddCampaign} />
      <SaveAsTemplateDialog
        open={showSaveTemplate}
        onOpenChange={setShowSaveTemplate}
        templateData={{
          utm_source: autoUtmSource,
          utm_medium: autoUtmMedium,
          utm_campaign: autoUtmCampaign,
          utm_content: utmContent || undefined,
          utm_term: utmTerm || undefined,
          entity: selectedEntities[0],
          team: selectedTeams[0],
        }}
      />
    </>
  );
};
