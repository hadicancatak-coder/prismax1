import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtmRuleBuilder } from "@/components/admin/UtmRuleBuilder";
import { UtmRuleTestPanel } from "@/components/admin/UtmRuleTestPanel";
import { RegenerateLinksDialog } from "@/components/admin/RegenerateLinksDialog";
import { useUtmRules } from "@/hooks/useUtmRules";
import { useUtmLpTypes } from "@/hooks/useUtmLpTypes";
import { UtmRule } from "@/lib/utmRuleEngine";
import { Plus, Edit, Trash, TestTube, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export function UtmAutomationTab() {
  const { rules, isLoading, saveRule, deleteRule, toggleRule } = useUtmRules();
  const { data: lpTypes = [] } = useUtmLpTypes();
  const [editingRule, setEditingRule] = useState<UtmRule | null>(null);
  const [testingRule, setTestingRule] = useState<UtmRule | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");

  // Group rules by parameter type
  const rulesByType = {
    utm_source: rules.filter(r => r.rule_name === 'utm_source'),
    utm_medium: rules.filter(r => r.rule_name === 'utm_medium'),
    utm_campaign: rules.filter(r => r.rule_name === 'utm_campaign'),
    utm_content: rules.filter(r => r.rule_name === 'utm_content'),
    utm_term: rules.filter(r => r.rule_name === 'utm_term'),
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

  const handleDelete = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteRule(ruleId, {
        onSuccess: () => toast.success('Rule deleted successfully'),
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

  if (isLoading) {
    return <TableSkeleton />;
  }

  const RuleGroup = ({ title, paramType, rules }: { title: string; paramType: string; rules: UtmRule[] }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline">{rules.length} rules</Badge>
        </CardTitle>
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
                    onClick={() => handleDelete(rule.id)}
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
    </div>
  );
}
