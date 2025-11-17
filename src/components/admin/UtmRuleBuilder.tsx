import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UtmRule } from "@/lib/utmRuleEngine";
import { UtmVariableSelector } from "./UtmVariableSelector";
import { getPreviewValue, validateTemplate } from "@/lib/utmVariables";
import { Save, X, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [priority, setPriority] = useState(rule?.priority || 0);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setHasPermission(false);
      return;
    }
    
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    setHasPermission(role?.role === 'admin');
  };

  const updatePreview = (newTemplate: string) => {
    setTemplate(newTemplate);
    if (newTemplate) {
      setPreview(getPreviewValue(newTemplate));
    } else {
      setPreview('');
    }
  };

  const handleSave = () => {
    if (!ruleName.trim()) {
      toast.error('UTM parameter selection is required');
      return;
    }

    if (ruleType === 'template') {
      if (!template.trim()) {
        toast.error('Template is required');
        return;
      }
      
      const validation = validateTemplate(template);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid template');
        return;
      }
    }

    const ruleData: Partial<UtmRule> = {
      ...(rule?.id && { id: rule.id }),
      rule_name: ruleName,
      rule_type: ruleType,
      template: ruleType === 'template' ? template : undefined,
      formula: ruleType === 'formula' ? formula : undefined,
      description,
      is_active: false,
      priority,
    };

    onSave(ruleData);
  };

  const handleVariableSelect = (variable: string) => {
    const input = templateInputRef.current;
    if (!input) {
      updatePreview(template + variable);
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = template.substring(0, start) + variable + template.substring(end);
    updatePreview(newValue);
    
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{rule ? 'Edit Rule' : 'Create New Rule'}</CardTitle>
        <CardDescription>
          Configure UTM automation rules using variables
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>UTM Parameter</Label>
            <Select value={ruleName} onValueChange={setRuleName}>
              <SelectTrigger>
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utm_source">utm_source</SelectItem>
                <SelectItem value="utm_medium">utm_medium</SelectItem>
                <SelectItem value="utm_campaign">utm_campaign</SelectItem>
                <SelectItem value="utm_content">utm_content</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rule Type</Label>
            <Select value={ruleType} onValueChange={(v) => setRuleType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">Template</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {ruleType === 'template' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Template</Label>
              <UtmVariableSelector onSelect={handleVariableSelect} />
            </div>
            <Input
              ref={templateInputRef}
              placeholder="Click 'Add Variable' to build"
              value={template}
              onChange={(e) => updatePreview(e.target.value)}
              className="font-mono text-sm"
            />
            {preview && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  <span>Preview:</span>
                </div>
                <code className="text-sm">{preview}</code>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe this rule..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={hasPermission === false}
          >
            {hasPermission === false ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Admin Only
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Rule
              </>
            )}
          </Button>
        </div>
        
        {hasPermission === false && (
          <p className="text-sm text-destructive text-center">
            ⚠️ You need admin permissions to create automation rules
          </p>
        )}
      </CardContent>
    </Card>
  );
}
