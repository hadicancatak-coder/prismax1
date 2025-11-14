import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UtmRuleBuilder } from "@/components/admin/UtmRuleBuilder";
import { UtmRuleFlowDiagram } from "@/components/admin/UtmRuleFlowDiagram";
import { UtmRuleTestPanel } from "@/components/admin/UtmRuleTestPanel";
import { useUtmRules } from "@/hooks/useUtmRules";
import { UtmRule } from "@/lib/utmRuleEngine";
import { Plus, Edit, Trash, TestTube } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function UtmAutomation() {
  const { rules, isLoading, saveRule, deleteRule, isSaving, isDeleting } = useUtmRules();
  const [editingRule, setEditingRule] = useState<UtmRule | null>(null);
  const [testingRule, setTestingRule] = useState<UtmRule | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const handleSave = (rule: Partial<UtmRule>) => {
    saveRule(rule, {
      onSuccess: () => {
        toast.success('Rule saved successfully');
        setShowBuilder(false);
        setEditingRule(null);
      },
      onError: () => {
        toast.error('Failed to save rule');
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
        <Button onClick={handleNewRule}>
          <Plus className="h-4 w-4 mr-2" />
          New Rule
        </Button>
      </div>

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
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{rule.rule_name}</CardTitle>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{rule.rule_type}</Badge>
                  </div>
                  <CardDescription>{rule.description}</CardDescription>
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
                  <code className="block p-2 bg-muted rounded text-sm">{rule.template}</code>
                </div>
              )}
              {rule.rule_type === 'formula' && rule.formula && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Formula:</p>
                  <code className="block p-2 bg-muted rounded text-sm">{rule.formula}</code>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
