import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SimpleMultiSelect } from "./SimpleMultiSelect";
import { AddCampaignDialog } from "./AddCampaignDialog";
import { SaveAsTemplateDialog } from "./SaveAsTemplateDialog";
import { UtmCompactList } from "./UtmCompactList";
import { useCreateUtmLink, useBulkCreateUtmLinks } from "@/hooks/useUtmLinks";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { useUtmTemplates } from "@/hooks/useUtmTemplates";
import { useEntityPresets, useCreateEntityPreset, useDeleteEntityPreset } from "@/hooks/useEntityPresets";
import { calculateUtmMedium, generateUtmCampaign, formatMonthYearReadable, buildUtmUrl, detectEntityFromUrl, generateStaticLpVariants, generateDynamicLpVariants, generateMauritiusLpVariants } from "@/lib/utmHelpers";
import { ENTITIES, TEAMS } from "@/lib/constants";
import { Copy, Save, AlertCircle, Plus, CheckCircle2, Zap, Settings2, Maximize2, FileText, X, Trash2, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface UtmBuilderProps {
  onSave?: () => void;
  onExpand?: (groupId: string) => void;
}

const LINK_PURPOSES = [
  { value: "AO", label: "AO" },
  { value: "Seminar", label: "Seminar" },
  { value: "Webinar", label: "Webinar" },
  { value: "Education", label: "Education" },
];

export const UtmBuilder = ({ onSave, onExpand }: UtmBuilderProps) => {
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
  const [isExtension, setIsExtension] = useState(false);
  const [deviceType, setDeviceType] = useState<'web' | 'mobile'>('web');
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
  
  // Expansion configuration
  const [selectedExpansionEntities, setSelectedExpansionEntities] = useState<string[]>([]);
  const [selectedExpansionLanguages, setSelectedExpansionLanguages] = useState<string[]>(['EN', 'AR']);
  
  // Preview state for expanded links (NOT saved to database)
  const [expandedLinksPreviews, setExpandedLinksPreviews] = useState<any[]>([]);
  
  // Preset management
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  
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
  const { data: entityPresets = [] } = useEntityPresets();
  const createPreset = useCreateEntityPreset();
  const deletePreset = useDeleteEntityPreset();

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
      
      // Initialize entity selection for static LPs
      if (detection.lpType === 'static') {
        setSelectedExpansionEntities(ENTITIES);
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

  // Auto-populate utm_content based on device type and extension mode
  useEffect(() => {
    if (isExtension && autoUtmCampaign) {
      // Extensions mode: campaign_month_Extension_device
      const extensionContent = `${autoUtmCampaign}_Extension_${deviceType}`;
      setUtmContent(extensionContent);
    } else {
      // Regular mode: just device type
      setUtmContent(deviceType);
    }
  }, [isExtension, autoUtmCampaign, deviceType]);

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
      setIsExtension(false);
      setDeviceType('web');
      
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

  const handleExpand = () => {
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
      const allVariants = generateStaticLpVariants(baseUrl, utmParams);
      variants = allVariants.filter(v => 
        selectedExpansionEntities.includes(v.entity) && 
        selectedExpansionLanguages.includes(v.language)
      );
    } else if (lpType === 'dynamic') {
      const allVariants = generateDynamicLpVariants(baseUrl, utmParams);
      variants = allVariants.filter(v => selectedExpansionLanguages.includes(v.language));
    } else if (lpType === 'mauritius') {
      const allVariants = generateMauritiusLpVariants(baseUrl, utmParams);
      variants = allVariants.filter(v => selectedExpansionLanguages.includes(v.language));
    }

    if (variants.length === 0) {
      toast.error('No variants selected. Please choose at least one entity/language.');
      return;
    }

    const expansionGroupId = crypto.randomUUID();
    
    const previewLinks = variants.map((variant) => ({
      id: crypto.randomUUID(),
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
      created_at: new Date().toISOString(),
    }));

    setExpandedLinksPreviews(previewLinks);
    toast.success(`Generated ${variants.length} link previews`);
  };

  const handleSaveExpandedLinks = async () => {
    if (expandedLinksPreviews.length === 0) return;
    
    try {
      await bulkCreateUtmLinks.mutateAsync(expandedLinksPreviews);
      toast.success(`✅ Saved ${expandedLinksPreviews.length} UTM links to database!`);
      setExpandedLinksPreviews([]);
      if (onSave) {
        onSave();
      }
    } catch (error) {
      toast.error('Failed to save links');
    }
  };

  const handleClearPreviews = () => {
    setExpandedLinksPreviews([]);
    toast.info('Preview cleared');
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    
    if (selectedExpansionEntities.length === 0) {
      toast.error('Please select at least one entity');
      return;
    }
    
    await createPreset.mutateAsync({
      name: presetName,
      entities: selectedExpansionEntities,
    });
    
    setPresetName('');
    setShowSavePreset(false);
  };

  const toggleEntity = (entity: string) => {
    setSelectedExpansionEntities(prev =>
      prev.includes(entity)
        ? prev.filter(e => e !== entity)
        : [...prev, entity]
    );
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

          {/* Device Type Selector - Always Visible */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="space-y-2">
              <Label className="font-semibold">Device Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={deviceType === 'web' ? 'default' : 'outline'}
                  onClick={() => setDeviceType('web')}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Web
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={deviceType === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setDeviceType('mobile')}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Mobile
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isExtension 
                  ? `Will generate: ${autoUtmCampaign || 'campaign'}_Extension_${deviceType}`
                  : `Will set utm_content to: ${deviceType}`
                }
              </p>
            </div>
          </div>

          {/* Extensions Checkbox - Separate Section */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="extensions-check"
                checked={isExtension}
                onCheckedChange={(checked) => {
                  setIsExtension(!!checked);
                }}
              />
              <Label htmlFor="extensions-check" className="font-semibold cursor-pointer">
                Extensions (Sitelinks, Callouts, etc.)
              </Label>
            </div>
            
            {isExtension && autoUtmCampaign && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Extension format: <strong>{autoUtmCampaign}_Extension_{deviceType}</strong>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* UTM Content Field - Always visible in both modes */}
          <div className="space-y-2">
            <Label htmlFor="utm-content">
              UTM Content
              <Badge variant="secondary" className="ml-2">Auto-generated</Badge>
            </Label>
            <Input
              id="utm-content"
              value={utmContent}
              onChange={(e) => setUtmContent(e.target.value)}
              placeholder="Auto-generated from device and extension settings"
              readOnly
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              {isExtension 
                ? "Format: campaign_month_Extension_device" 
                : "Format: device type (web/mobile)"
              }
            </p>
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

          {/* Expansion Configuration */}
          {fullUrl && lpType && (
            <details className="space-y-4 border rounded-lg p-4">
              <summary className="cursor-pointer font-medium flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Configure Expansion Options
              </summary>
              <div className="space-y-4 pt-4">
                {/* Language Selection */}
                <div className="space-y-2">
                  <Label>Languages to Generate</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedExpansionLanguages.includes('EN') ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedExpansionLanguages(prev =>
                          prev.includes('EN') 
                            ? prev.filter(l => l !== 'EN')
                            : [...prev, 'EN']
                        );
                      }}
                    >
                      English (EN)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedExpansionLanguages.includes('AR') ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedExpansionLanguages(prev =>
                          prev.includes('AR')
                            ? prev.filter(l => l !== 'AR')
                            : [...prev, 'AR']
                        );
                      }}
                    >
                      Arabic (AR)
                    </Button>
                  </div>
                </div>
                
                {/* Entity Selection (Static LP only) */}
                {lpType === 'static' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Entities to Generate</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedExpansionEntities([])}
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedExpansionEntities(ENTITIES)}
                        >
                          Select All
                        </Button>
                      </div>
                    </div>
                    
                    {/* Entity Presets */}
                    {entityPresets.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Quick Select Presets</Label>
                        <div className="flex flex-wrap gap-2">
                          {entityPresets.map((preset) => (
                            <div key={preset.id} className="relative group">
                              <Badge
                                variant="secondary"
                                className="cursor-pointer pr-8"
                                onClick={() => setSelectedExpansionEntities(preset.entities)}
                              >
                                {preset.name} ({preset.entities.length})
                              </Badge>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute right-0 top-0 h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePreset.mutate(preset.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Entity Toggle Badges */}
                    <div className="flex flex-wrap gap-2">
                      {ENTITIES.map(entity => (
                        <Badge
                          key={entity}
                          variant={selectedExpansionEntities.includes(entity) ? 'default' : 'outline'}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => toggleEntity(entity)}
                        >
                          {entity}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Save Preset Button */}
                    {selectedExpansionEntities.length > 0 && (
                      <Dialog open={showSavePreset} onOpenChange={setShowSavePreset}>
                        <DialogTrigger asChild>
                          <Button type="button" size="sm" variant="outline" className="w-full">
                            <Save className="h-3 w-3 mr-2" />
                            Save as Preset
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Save Entity Preset</DialogTitle>
                            <DialogDescription>
                              Save your current selection ({selectedExpansionEntities.length} entities) as a preset for quick access
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="preset-name">Preset Name</Label>
                              <Input
                                id="preset-name"
                                placeholder="e.g., Middle East, Africa, GCC..."
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                              />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {selectedExpansionEntities.map(entity => (
                                <Badge key={entity} variant="secondary" className="text-xs">
                                  {entity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowSavePreset(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSavePreset}>
                              Save Preset
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Will generate {lpType === 'static' 
                      ? `${selectedExpansionEntities.length} entities × ${selectedExpansionLanguages.length} languages = ${selectedExpansionEntities.length * selectedExpansionLanguages.length} links`
                      : `${selectedExpansionLanguages.length} language variant(s)`
                    }
                  </AlertDescription>
                </Alert>
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
                      <Button 
                        onClick={handleExpand} 
                        disabled={!isFormValid || selectedExpansionLanguages.length === 0} 
                        variant="default" 
                        size="lg" 
                        className="flex-1"
                      >
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Expand ({lpType === 'static' ? (selectedExpansionEntities.length * selectedExpansionLanguages.length) : selectedExpansionLanguages.length})
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

          {/* Validation Feedback */}
          {!isFormValid && baseUrl && selectedCampaign && selectedPlatform && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {lpType === 'dynamic' && !dynamicLanguage 
                  ? "Please select a language for Dynamic LP to enable preview and actions" 
                  : "Please fill in all required fields (*) to generate the UTM link"}
              </AlertDescription>
            </Alert>
          )}
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

      {/* Expanded Links Preview */}
      {expandedLinksPreviews.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Expanded Links Preview ({expandedLinksPreviews.length})</CardTitle>
                <CardDescription>Review before saving to database</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearPreviews}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Preview
                </Button>
                <Button onClick={handleSaveExpandedLinks}>
                  <Save className="h-4 w-4 mr-2" />
                  Save All to Database
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UtmCompactList links={expandedLinksPreviews} />
          </CardContent>
        </Card>
      )}
    </>
  );
};
