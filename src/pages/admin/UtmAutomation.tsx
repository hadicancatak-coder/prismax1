import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtmRuleBuilder } from "@/components/admin/UtmRuleBuilder";
import { UtmRuleFlowDiagram } from "@/components/admin/UtmRuleFlowDiagram";
import { UtmRuleTestPanel } from "@/components/admin/UtmRuleTestPanel";
import { UtmRuleGuide } from "@/components/admin/UtmRuleGuide";
import { RegenerateLinksDialog } from "@/components/admin/RegenerateLinksDialog";
import { useUtmRules } from "@/hooks/useUtmRules";
import { UtmRule } from "@/lib/utmRuleEngine";
import { Plus, Edit, Trash, TestTube, BookOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function UtmAutomation() {
  const { rules, isLoading, saveRule, deleteRule, toggleRule, isSaving, isDeleting, isToggling } = useUtmRules();
  const [editingRule, setEditingRule] = useState<UtmRule | null>(null);
  const [testingRule, setTestingRule] = useState<UtmRule | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);

  const handleSave = (rule: Partial<UtmRule>) => {
    saveRule(rule, {
      onSuccess: () => {
        toast.success('✅ Rule saved successfully and will be available after activation');
        setShowBuilder(false);
        setEditingRule(null);
      },
      onError: (error: Error) => {
        console.error('Failed to save rule:', error);
        
        // Show specific error messages
        let errorMessage = 'Failed to save rule';
        
        if (error.message.includes('row-level security') || error.message.includes('permission')) {
          errorMessage = '🔒 You need admin permissions to create automation rules';
        } else if (error.message.includes('unique constraint')) {
          errorMessage = '⚠️ A rule with this name already exists for this parameter';
        } else if (error.message.includes('foreign key')) {
          errorMessage = '⚠️ Invalid reference in rule configuration';
        } else if (error.message) {
          errorMessage = `❌ ${error.message}`;
        }
        
        toast.error(errorMessage, {
          duration: 5000,
        });
      },
    });
  };

  const handleDelete = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteRule(ruleId, {
        onSuccess: () => {
          toast.success('Rule deleted successfully');
        },
        onError: () => {
          toast.error('Failed to delete rule');
        },
      });
    }
  };

  const handleEdit = (rule: UtmRule) => {
    setEditingRule(rule);
    setShowBuilder(true);
  };

  const handleNewRule = () => {
    setEditingRule(null);
    setShowBuilder(true);
  };

  const handleToggle = (rule: UtmRule, isActive: boolean) => {
    toggleRule(
      { ruleId: rule.id, isActive, ruleName: rule.rule_name },
      {
        onSuccess: () => {
          toast.success(isActive ? 'Rule activated' : 'Rule deactivated');
        },
        onError: () => {
          toast.error('Failed to toggle rule');
        },
      }
    );
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">UTM Automation Rules</h1>
          <p className="text-muted-foreground">Configure how UTM parameters are generated</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRegenerate(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate All Links
          </Button>
          <Button onClick={handleNewRule}>
            <Plus className="h-4 w-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      <RegenerateLinksDialog open={showRegenerate} onOpenChange={setShowRegenerate} />

      {/* Tabs: Guide, Rules, Create */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guide" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Guide
          </TabsTrigger>
          <TabsTrigger value="rules">
            Rules ({rules.length})
          </TabsTrigger>
        </TabsList>

        {/* Guide Tab */}
        <TabsContent value="guide" className="space-y-6">
          <UtmRuleGuide />
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          {/* Flow Diagram */}
          <UtmRuleFlowDiagram rules={rules} />

          {/* Rule Builder */}
          {showBuilder && (
            <UtmRuleBuilder
              rule={editingRule}
              onSave={handleSave}
              onCancel={() => {
                setShowBuilder(false);
                setEditingRule(null);
              }}
            />
          )}

          {/* Test Panel */}
          {testingRule && (
            <UtmRuleTestPanel rule={testingRule} />
          )}

          {/* Rules List */}
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Active Rules ({rules.length})</h2>
            {rules.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground">No rules created yet</p>
                  <p className="text-sm text-muted-foreground">
                    Check out the <strong>Guide</strong> tab to learn how to create your first automation rule
                  </p>
                  <Button onClick={handleNewRule} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Rule
                  </Button>
                </div>
              </Card>
            ) : (
              rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{rule.rule_name}</CardTitle>
                          {rule.is_active && <Badge>Live</Badge>}
                          <Badge variant="outline">{rule.rule_type}</Badge>
                        </div>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => handleToggle(rule, checked)}
                          disabled={isToggling}
                        />
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTestingRule(testingRule?.id === rule.id ? null : rule)}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(rule.id)}
                          disabled={isDeleting}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {rule.rule_type === 'template' && rule.template && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Template:</p>
                        <code className="block p-2 bg-muted rounded text-sm font-mono">{rule.template}</code>
                      </div>
                    )}
                    {rule.rule_type === 'formula' && rule.formula && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Formula:</p>
                        <code className="block p-2 bg-muted rounded text-sm font-mono">{rule.formula}</code>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
