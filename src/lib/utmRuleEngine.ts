import { supabase } from "@/integrations/supabase/client";
import { formatMonthYear2Digit, generateUtmContent } from "./utmHelpers";
import { replaceVariables } from "./utmVariables";

export type { UtmRuleContext } from "./utmVariables";
import type { UtmRuleContext } from "./utmVariables";

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

// Cache for active rules (5 minute TTL)
let ruleCache: { rules: UtmRule[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class UtmRuleEngine {
  static async executeRule(ruleName: string, context: UtmRuleContext): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Get active rules for this parameter
      const rules = await this.getRulesForParameter(ruleName);
      
      // Execute first matching rule
      for (const rule of rules) {
        try {
          let output = "";
          
          if (rule.rule_type === 'template' && rule.template) {
            output = replaceVariables(rule.template, context);
          } else if (rule.rule_type === 'formula' && rule.formula) {
            // For future: execute formula
            output = replaceVariables(rule.formula, context);
          }
          
          if (output) {
            // Log successful execution
            await this.logExecution(rule.id, context, output, Date.now() - startTime, true);
            return output;
          }
        } catch (error) {
          console.error(`Rule ${rule.id} failed:`, error);
          await this.logExecution(
            rule.id,
            context,
            "",
            Date.now() - startTime,
            false,
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      }
    } catch (error) {
      console.error(`Error executing rule ${ruleName}:`, error);
    }
    
    // Fallback to old logic
    return this.getFallback(ruleName, context);
  }

  private static async getRulesForParameter(ruleName: string): Promise<UtmRule[]> {
    // Check cache first
    if (ruleCache && Date.now() - ruleCache.timestamp < CACHE_TTL) {
      return ruleCache.rules.filter(r => r.rule_name === ruleName);
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('utm_automation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    if (error) {
      console.error('Error fetching rules:', error);
      return [];
    }

    // Update cache
    ruleCache = {
      rules: (data || []) as unknown as UtmRule[],
      timestamp: Date.now(),
    };

    return ruleCache.rules.filter(r => r.rule_name === ruleName);
  }

  private static async logExecution(
    ruleId: string,
    context: UtmRuleContext,
    output: string,
    executionTimeMs: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.from('utm_rule_executions').insert([{
        rule_id: ruleId,
        input_context: context as any,
        output_value: output,
        execution_time_ms: executionTimeMs,
        success,
        error_message: errorMessage,
      }]);
    } catch (error) {
      console.error('Failed to log rule execution:', error);
    }
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
    try {
      const { data, error } = await supabase
        .from('utm_automation_rules')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as UtmRule[];
    } catch (error) {
      console.error('Error fetching rules:', error);
      return [];
    }
  }

  static async saveRule(rule: Partial<UtmRule>) {
    // Clear cache when saving
    ruleCache = null;
    
    const { error } = rule.id
      ? await supabase.from('utm_automation_rules').update(rule as any).eq('id', rule.id)
      : await supabase.from('utm_automation_rules').insert([rule as any]);
    return { success: !error, error: error?.message };
  }

  static async deleteRule(ruleId: string) {
    // Clear cache when deleting
    ruleCache = null;
    
    const { error } = await supabase.from('utm_automation_rules').delete().eq('id', ruleId);
    return { success: !error, error: error?.message };
  }

  static async toggleRuleActive(ruleId: string, isActive: boolean, ruleName: string) {
    // Clear cache when toggling
    ruleCache = null;
    
    // If activating, deactivate all other rules for this parameter
    if (isActive) {
      await supabase
        .from('utm_automation_rules')
        .update({ is_active: false })
        .eq('rule_name', ruleName)
        .neq('id', ruleId);
    }
    
    const { error } = await supabase
      .from('utm_automation_rules')
      .update({ is_active: isActive })
      .eq('id', ruleId);
      
    return { success: !error, error: error?.message };
  }

  static async testRule(rule: UtmRule, context: UtmRuleContext): Promise<string> {
    if (rule.rule_type === 'template' && rule.template) {
      return replaceVariables(rule.template, context);
    }
    return this.getFallback(rule.rule_name, context);
  }
}

