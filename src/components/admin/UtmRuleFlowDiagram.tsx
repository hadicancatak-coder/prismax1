import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtmRule } from "@/lib/utmRuleEngine";

interface UtmRuleFlowDiagramProps {
  rules: UtmRule[];
}

export function UtmRuleFlowDiagram({ rules }: UtmRuleFlowDiagramProps) {
  const generateMermaidFlow = () => {
    const campaignRule = rules.find(r => r.rule_name === 'utm_campaign');
    const contentRule = rules.find(r => r.rule_name === 'utm_content');

    return `graph TB
  A[Input: Campaign Data] --> B{Rule Type}
  
  B -->|utm_campaign| C[Platform + Campaign + MonthYY]
  B -->|utm_content| D{LP URL Empty?}
  B -->|utm_source| E[Platform Name]
  B -->|utm_medium| F[Calculate from Platform]
  
  C --> G[Format: ${campaignRule?.template || '{platform}_{campaign}_{monthYY}'}]
  
  D -->|Yes| H[⚠️ Add LP URL]
  D -->|No| I[Extract Last Slug]
  
  I --> J{Is Numeric?}
  J -->|Yes| K[Use Campaign Name]
  J -->|No| L[Use Slug]
  
  G --> M[UTM Parameters]
  H --> M
  K --> M
  L --> M
  E --> M
  F --> M
  
  M --> N[Complete UTM URL]
  
  style C fill:#4CAF50,stroke:#2E7D32,color:#fff
  style D fill:#FF9800,stroke:#F57C00,color:#fff
  style M fill:#2196F3,stroke:#1565C0,color:#fff
  style N fill:#9C27B0,stroke:#6A1B9A,color:#fff`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>UTM Generation Flow</CardTitle>
        <CardDescription>Visual representation of how UTM parameters are generated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto bg-muted/30 p-4 rounded-lg">
          <pre className="text-xs font-mono whitespace-pre">
            {generateMermaidFlow()}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
