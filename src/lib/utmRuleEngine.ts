import { supabase } from "@/integrations/supabase/client";
import { formatMonthYear2Digit, generateUtmContent } from "./utmHelpers";

export interface UtmRuleContext {
  platform: string;
  campaign: string;
  entity?: string;
  lpUrl: string;
  webinar?: string;
  city?: string;
  device?: string;
  date?: Date;
}

export interface UtmRule {
  id: string;
  rule_name: string;
  rule_type: 'formula' | 'template' | 'conditional';
  formula?: string;
  template?: string;
  conditions?: any;
  priority: number;
  is_active: boolean;
  description?: string;
}

export class UtmRuleEngine {
  static async executeRule(ruleName: string, context: UtmRuleContext): Promise<string> {
    return this.getFallback(ruleName, context);
  }

  private static getFallback(ruleName: string, context: UtmRuleContext): string {
    const fallbacks: Record<string, () => string> = {
      utm_campaign: () => `${context.platform.toLowerCase()}_${context.campaign.toLowerCase()}_${formatMonthYear2Digit(context.date || new Date())}`,
      utm_content: () => generateUtmContent(context.lpUrl, context.campaign),
      utm_source: () => context.platform.toLowerCase(),
      utm_medium: () => 'cpc',
    };
    return fallbacks[ruleName]?.() || '';
  }

  static async getAllRules(): Promise<UtmRule[]> {
    const { data } = await supabase.from('utm_automation_rules').select('*').eq('is_active', true);
    return (data || []) as any;
  }

  static async saveRule(rule: Partial<UtmRule>) {
    if (rule.id) {
      return await supabase.from('utm_automation_rules').update(rule).eq('id', rule.id);
    }
    return await supabase.from('utm_automation_rules').insert(rule);
  }

  static async deleteRule(ruleId: string) {
    return await supabase.from('utm_automation_rules').delete().eq('id', ruleId);
  }

  static async testRule(rule: UtmRule, context: UtmRuleContext): Promise<string> {
    return this.getFallback(rule.rule_name, context);
  }
}
