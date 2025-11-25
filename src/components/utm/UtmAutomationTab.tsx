import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UtmRuleBuilder } from "@/components/admin/UtmRuleBuilder";
import { UtmRuleTestPanel } from "@/components/admin/UtmRuleTestPanel";
import { RegenerateLinksDialog } from "@/components/admin/RegenerateLinksDialog";
import { useUtmRules } from "@/hooks/useUtmRules";
import { useUtmLpTypes } from "@/hooks/useUtmLpTypes";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { UtmRule } from "@/lib/utmRuleEngine";
import { transformEntityUrl, detectUrlPattern } from "@/lib/entityUrlTransformer";
import { Plus, Edit, Trash, TestTube, RefreshCw, Info, AlertCircle, Globe, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export function UtmAutomationTab() {
  const { rules, isLoading, saveRule, deleteRule, toggleRule } = useUtmRules();
  const { data: lpTypes = [] } = useUtmLpTypes();
  const { data: entities = [] } = useSystemEntities();
  const [editingRule, setEditingRule] = useState<UtmRule | null>(null);
  const [testingRule, setTestingRule] = useState<UtmRule | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [selectedLpType, setSelectedLpType] = useState<string>('all');
  
  // Entity Switch feature state
  const [entitySwitchEnabled, setEntitySwitchEnabled] = useState(false);
  const [sourceEntity, setSourceEntity] = useState<string>('');
  const [targetEntity, setTargetEntity] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'ar' | 'keep'>('keep');
  const [previewUrl, setPreviewUrl] = useState('https://cfdibahrain.com/en/kw/open-account');

  // Filter and group rules
  const filteredRules = selectedLpType === 'all' 
    ? rules 
    : rules.filter(r => !r.lp_type_id || r.lp_type_id === selectedLpType);

  const rulesByType = {
    utm_source: filteredRules.filter(r => r.rule_name === 'utm_source'),
    utm_medium: filteredRules.filter(r => r.rule_name === 'utm_medium'),
    utm_campaign: filteredRules.filter(r => r.rule_name === 'utm_campaign'),
    utm_content: filteredRules.filter(r => r.rule_name === 'utm_content'),
    utm_term: filteredRules.filter(r => r.rule_name === 'utm_term'),
  };

  const handleSave = (rule: Partial<UtmRule>) => {
    saveRule(rule, {
      onSuccess: () => {
        toast.success('Rule saved successfully');
        setShowBuilder(false);
        setEditingRule(null);
      },
      onError: (error: Error) => {
        toast.error('Failed to save rule: ' + error.message);
      },
    });
  };

  const handleDeleteClick = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete, {
        onSuccess: () => {
          toast.success('Rule deleted successfully');
          setDeleteDialogOpen(false);
          setRuleToDelete(null);
        },
        onError: () => toast.error('Failed to delete rule'),
      });
    }
  };

  const handleToggle = (rule: UtmRule, isActive: boolean) => {
    toggleRule(
      { ruleId: rule.id, isActive, ruleName: rule.rule_name },
      {
        onSuccess: () => toast.success(isActive ? 'Rule activated' : 'Rule deactivated'),
        onError: () => toast.error('Failed to toggle rule'),
      }
    );
  };

  // Entity Switch handlers
  const handlePreviewUrlChange = (url: string) => {
    setPreviewUrl(url);
  };

  const getTransformedUrl = () => {
    if (!sourceEntity || !targetEntity || !previewUrl) return previewUrl;
    
    const entityMappings = entities.map(e => ({
      code: e.code,
      name: e.name,
      websiteParam: e.website_param,
      urlCodes: [e.website_param?.toLowerCase() || e.code.toLowerCase(), e.code.toLowerCase()],
    }));

    return transformEntityUrl(
      previewUrl,
      { sourceEntity, targetEntity, language },
      entityMappings
    );
  };

  const handleApplyTransformation = () => {
    if (!sourceEntity || !targetEntity) {
      toast.error('Please select both source and target entities');
      return;
    }
    
    const transformedUrl = getTransformedUrl();
    toast.success('URL transformation applied', {
      description: transformedUrl,
    });
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  const fallbackExamples: Record<string, string> = {
    utm_source: '{platform}',
    utm_medium: 'cpc',
    utm_campaign: '{platform}_{campaign}_{monthYY}',
    utm_content: 'Generated from LP URL',
    utm_term: '(empty)',
  };

  const FallbackRulesInfo = () => (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
          <Info className="h-5 w-5" />
          Default Fallback Rules (Active when no custom rules exist)
        </CardTitle>
        <CardDescription>
          These defaults are used automatically when you haven't created custom rules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Badge variant="outline" className="shrink-0">utm_source</Badge>
            <div className="flex-1">
              <div className="text-sm font-mono text-foreground">
                {`{platform}`} 
                <span className="text-xs ml-2 text-muted-foreground">(e.g., "google", "facebook")</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Badge variant="outline" className="shrink-0">utm_medium</Badge>
            <div className="flex-1">
              <div className="text-sm font-mono text-foreground">
                cpc 
                <span className="text-xs ml-2 text-muted-foreground">(hardcoded as "cpc")</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Badge variant="outline" className="shrink-0">utm_campaign</Badge>
            <div className="flex-1">
              <div className="text-sm font-mono text-foreground">
                {`{platform}_{campaign}_{monthYY}`}
                <span className="text-xs ml-2 text-muted-foreground">(e.g., "google_gold_nov25")</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Badge variant="outline" className="shrink-0">utm_content</Badge>
            <div className="flex-1">
              <div className="text-sm font-mono text-foreground">
                Generated from LP URL slug
                <span className="text-xs ml-2 text-muted-foreground">(e.g., "open_account", "webinar_forex")</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Badge variant="outline" className="shrink-0">utm_term</Badge>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground italic">
                (No fallback - remains empty)
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
          <span>Create custom rules above to override these defaults for specific landing page types</span>
        </div>
      </CardContent>
    </Card>
  );

  const RuleGroup = ({ title, paramType, rules }: { title: string; paramType: string; rules: UtmRule[] }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            {rules.length === 0 && (
              <Badge variant="outline" className="text-amber-600 dark:text-amber-500 border-amber-600/30">
                Using Fallback
              </Badge>
            )}
            <Badge variant="outline">{rules.length} rules</Badge>
          </div>
        </CardTitle>
        {rules.length === 0 && (
          <CardDescription className="text-warning flex items-center gap-1">
            <Info className="h-3 w-3" />
            Default: <code className="px-1 py-0.5 bg-muted rounded text-xs text-foreground">{fallbackExamples[paramType]}</code>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rules.length === 0 ? (
            <p className="text-muted-foreground text-sm">No rules configured</p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rule.rule_type}</span>
                    {rule.is_active && <Badge variant="success">Active</Badge>}
                    {rule.lp_type_id && (
                      <Badge variant="outline" className="bg-info/10 text-info-foreground">
                        {lpTypes.find(t => t.id === rule.lp_type_id)?.name || 'LP Type'}
                      </Badge>
                    )}
                    {rule.description && (
                      <span className="text-sm text-muted-foreground">- {rule.description}</span>
                    )}
                  </div>
                  {rule.template && (
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">
                      {rule.template}
                    </code>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) => handleToggle(rule, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTestingRule(rule)}
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingRule(rule);
                      setShowBuilder(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(rule.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">UTM Automation</h2>
          <p className="text-muted-foreground">
            Configure rules to automatically generate UTM parameters
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRegenerate(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Links
          </Button>
          <Button onClick={() => {
            setEditingRule(null);
            setShowBuilder(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Rules by Category</TabsTrigger>
          <TabsTrigger value="test">Test Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {/* Entity Switch Feature */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-sm text-heading-md">
                    <Globe className="h-5 w-5 text-primary" />
                    Entity Switch
                  </CardTitle>
                  <CardDescription className="text-metadata">
                    Transform URLs between entities and languages
                  </CardDescription>
                </div>
                <Switch
                  checked={entitySwitchEnabled}
                  onCheckedChange={setEntitySwitchEnabled}
                />
              </div>
            </CardHeader>
            
            {entitySwitchEnabled && (
              <CardContent className="space-y-md">
                <div className="grid grid-cols-3 gap-md">
                  <div className="space-y-2">
                    <Label htmlFor="source-entity" className="text-body-sm font-medium">Source Entity</Label>
                    <Select value={sourceEntity} onValueChange={setSourceEntity}>
                      <SelectTrigger id="source-entity">
                        <SelectValue placeholder="Select source..." />
                      </SelectTrigger>
                      <SelectContent>
                        {entities.map(e => (
                          <SelectItem key={e.code} value={e.code}>
                            {e.emoji && <span className="mr-2">{e.emoji}</span>}
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target-entity" className="text-body-sm font-medium">Target Entity</Label>
                    <Select value={targetEntity} onValueChange={setTargetEntity}>
                      <SelectTrigger id="target-entity">
                        <SelectValue placeholder="Select target..." />
                      </SelectTrigger>
                      <SelectContent>
                        {entities.map(e => (
                          <SelectItem key={e.code} value={e.code}>
                            {e.emoji && <span className="mr-2">{e.emoji}</span>}
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language-select" className="text-body-sm font-medium">Language</Label>
                    <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'ar' | 'keep')}>
                      <SelectTrigger id="language-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keep">Keep Original</SelectItem>
                        <SelectItem value="en">English (EN)</SelectItem>
                        <SelectItem value="ar">Arabic (AR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preview-url" className="text-body-sm font-medium">Preview URL</Label>
                  <Input
                    id="preview-url"
                    value={previewUrl}
                    onChange={(e) => handlePreviewUrlChange(e.target.value)}
                    placeholder="https://cfdibahrain.com/en/kw/open-account"
                    className="font-mono text-body-sm"
                  />
                </div>
                
                {/* Preview Section */}
                {sourceEntity && targetEntity && (
                  <div className="border rounded-lg p-md bg-muted/50 space-y-sm">
                    <Label className="text-metadata text-muted-foreground">Transformation Preview</Label>
                    <div className="space-y-sm">
                      <div className="flex items-center gap-sm">
                        <Badge variant="outline" className="shrink-0 text-metadata">Before</Badge>
                        <code className="text-body-sm font-mono text-foreground truncate block">
                          {previewUrl}
                        </code>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-sm">
                        <Badge variant="default" className="shrink-0 text-metadata">After</Badge>
                        <code className="text-body-sm font-mono text-primary truncate block">
                          {getTransformedUrl()}
                        </code>
                      </div>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleApplyTransformation} 
                  className="w-full transition-smooth"
                  disabled={!sourceEntity || !targetEntity}
                >
                  Apply Transformation
                </Button>
              </CardContent>
            )}
          </Card>

          {/* LP Type Filter */}
          <div className="flex items-center gap-md">
            <Label htmlFor="lp-type-filter" className="whitespace-nowrap text-body-sm">Filter by LP Type:</Label>
            <Select value={selectedLpType} onValueChange={setSelectedLpType}>
              <SelectTrigger id="lp-type-filter" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LP Types</SelectItem>
                {lpTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showBuilder ? (
            <UtmRuleBuilder
              rule={editingRule}
              onSave={handleSave}
              onCancel={() => {
                setShowBuilder(false);
                setEditingRule(null);
              }}
            />
          ) : (
            <div className="grid gap-4">
              <RuleGroup title="🎯 UTM Source Rules" paramType="utm_source" rules={rulesByType.utm_source} />
              <RuleGroup title="📢 UTM Medium Rules" paramType="utm_medium" rules={rulesByType.utm_medium} />
              <RuleGroup title="🚀 UTM Campaign Rules" paramType="utm_campaign" rules={rulesByType.utm_campaign} />
              <RuleGroup title="📝 UTM Content Rules" paramType="utm_content" rules={rulesByType.utm_content} />
              <RuleGroup title="🔍 UTM Term Rules" paramType="utm_term" rules={rulesByType.utm_term} />
              
              <FallbackRulesInfo />
            </div>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          {testingRule ? (
            <div>
              <Button variant="outline" onClick={() => setTestingRule(null)} className="mb-4">
                Back to Rules
              </Button>
              <UtmRuleTestPanel rule={testingRule} />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Select a rule to test from the Rules tab
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <RegenerateLinksDialog open={showRegenerate} onOpenChange={setShowRegenerate} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rule will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
