import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UtmRuleEngine, UtmRule } from "@/lib/utmRuleEngine";

export function useUtmRules() {
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ['utm-rules'],
    queryFn: () => UtmRuleEngine.getAllRules(),
  });

  const saveRuleMutation = useMutation({
    mutationFn: (rule: Partial<UtmRule>) => UtmRuleEngine.saveRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-rules'] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => UtmRuleEngine.deleteRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-rules'] });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ ruleId, isActive, ruleName }: { ruleId: string; isActive: boolean; ruleName: string }) => 
      UtmRuleEngine.toggleRuleActive(ruleId, isActive, ruleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utm-rules'] });
    },
  });

  return {
    rules,
    isLoading,
    error,
    saveRule: saveRuleMutation.mutate,
    deleteRule: deleteRuleMutation.mutate,
    toggleRule: toggleRuleMutation.mutate,
    isSaving: saveRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
    isToggling: toggleRuleMutation.isPending,
  };
}
