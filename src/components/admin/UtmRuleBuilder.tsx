import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UtmRule } from "@/lib/utmRuleEngine";
import { Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface UtmRuleBuilderProps {
  rule?: UtmRule | null;
  onSave: (rule: Partial<UtmRule>) => void;
  onCancel: () => void;
}

export function UtmRuleBuilder({ rule, onSave, onCancel }: UtmRuleBuilderProps) {
  const [ruleName, setRuleName] = useState(rule?.rule_name || '');
  const [ruleType, setRuleType] = useState<'formula' | 'template' | 'conditional'>(rule?.rule_type || 'template');
  const [template, setTemplate] = useState(rule?.template || '');
  const [formula, setFormula] = useState(rule?.formula || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [isActive, setIsActive] = useState(rule?.is_active ?? true);
  const [priority, setPriority] = useState(rule?.priority || 0);

  const variables = [
    { name: '{platform}', description: 'Platform name (e.g., google, facebook)' },
    { name: '{campaign}', description: 'Campaign name' },
    { name: '{entity}', description: 'Entity name' },
    { name: '{monthYY}', description: 'Month and year (e.g., nov25)' },
    { name: '{monthYear}', description: 'Month and year (e.g., nov2025)' },
    { name: '{monthFullYY}', description: 'Full month name and year (e.g., November25)' },
    { name: '{city}', description: 'City name' },
    { name: '{webinar}', description: 'Webinar name' },
    { name: '{device}', description: 'Device type (mobile/desktop)' },
  ];

  const formulaOptions = [
    { value: 'extractSlugOrCampaign', label: 'Extract Slug or Campaign', description: 'Extract last URL segment or use campaign name' },
    { value: 'platformLowercase', label: 'Platform Lowercase', description: 'Convert platform to lowercase' },
    { value: 'campaignLowercase', label: 'Campaign Lowercase', description: 'Convert campaign to lowercase' },
  ];

  const handleSave = () => {
    if (!ruleName.trim()) {
      toast.error('Rule name is required');
      return;
    }

    if (ruleType === 'template' && !template.trim()) {
      toast.error('Template is required for template rules');
      return;
    }

    if (ruleType === 'formula' && !formula.trim()) {
      toast.error('Formula is required for formula rules');
      return;
    }

    const ruleData: Partial<UtmRule> = {
      id: rule?.id,
      rule_name: ruleName,
      rule_type: ruleType,
      template: ruleType === 'template' ? template : undefined,
      formula: ruleType === 'formula' ? formula : undefined,
      description,
      is_active: isActive,
      priority,
    };

    onSave(ruleData);
  };

  const insertVariable = (variable: string) => {
    if (ruleType === 'template') {
      setTemplate(prev => prev + variable);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{rule ? 'Edit Rule' : 'Create New Rule'}</CardTitle>
        <CardDescription>
          Configure UTM automation rules with templates or formulas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule Name</Label>
            <Input
              id="rule-name"
              placeholder="utm_campaign"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-type">Rule Type</Label>
            <Select value={ruleType} onValueChange={(v: any) => setRuleType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="formula">Formula</SelectItem>
                <SelectItem value="conditional">Conditional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Describe what this rule does"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Template Builder */}
        {ruleType === 'template' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Textarea
                id="template"
                placeholder="{platform}_{campaign}_{monthYY}"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Available Variables</Label>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable) => (
                  <Badge
                    key={variable.name}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => insertVariable(variable.name)}
                    title={variable.description}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {variable.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Formula Builder */}
        {ruleType === 'formula' && (
          <div className="space-y-2">
            <Label htmlFor="formula">Formula</Label>
            <Select value={formula} onValueChange={setFormula}>
              <SelectTrigger>
                <SelectValue placeholder="Select a predefined formula" />
              </SelectTrigger>
              <SelectContent>
                {formulaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Conditional Builder */}
        {ruleType === 'conditional' && (
          <div className="space-y-2">
            <Label>Conditional Logic</Label>
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Conditional rules are coming soon. Use template or formula rules for now.
              </p>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="is-active">Active</Label>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Rule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
