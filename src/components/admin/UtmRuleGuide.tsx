import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lightbulb, Code, Zap, Target, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function UtmRuleGuide() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">UTM Automation Rules Guide</CardTitle>
              <CardDescription className="text-base mt-2">
                Learn how to create powerful automation rules to generate consistent UTM parameters across all your campaigns.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* What Are UTM Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle>What are UTM Automation Rules?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            UTM Automation Rules let you define templates and formulas that automatically generate UTM parameters based on your campaign details. 
            Instead of manually typing utm_campaign, utm_content, etc. for every link, you create rules once and the system generates them for you.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-semibold mb-2">🎯 Consistency</h4>
              <p className="text-sm text-muted-foreground">Ensure all your campaigns follow the same naming conventions</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-semibold mb-2">⚡ Speed</h4>
              <p className="text-sm text-muted-foreground">Generate hundreds of UTM links in seconds instead of hours</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-semibold mb-2">✅ Accuracy</h4>
              <p className="text-sm text-muted-foreground">Eliminate typos and human errors in UTM parameters</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rule Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <CardTitle>Rule Types Explained</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="template">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Template</Badge>
                  <span>Template Rules (Easiest)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-muted-foreground">
                  Use placeholders like <code className="px-2 py-1 rounded bg-muted">{"{platform}"}</code>, <code className="px-2 py-1 rounded bg-muted">{"{campaign}"}</code>, etc. that get replaced with actual values.
                </p>
                <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                  <div className="font-mono text-sm">
                    <span className="text-muted-foreground">Template:</span> <code>{"{platform}"}_{"{campaign}"}_{"{monthYY}"}</code>
                  </div>
                  <div className="font-mono text-sm">
                    <span className="text-muted-foreground">Result:</span> <code className="text-primary">google_summer-sale_nov25</code>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="formula">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Formula</Badge>
                  <span>Formula Rules (Advanced)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-muted-foreground">
                  Write JavaScript code to transform values. Access context variables and use custom logic.
                </p>
                <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                  <div className="font-mono text-sm">
                    <span className="text-muted-foreground">Formula:</span> <code>context.platform.toUpperCase() + '_' + context.campaign</code>
                  </div>
                  <div className="font-mono text-sm">
                    <span className="text-muted-foreground">Result:</span> <code className="text-primary">GOOGLE_summer-sale</code>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="conditional">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Conditional</Badge>
                  <span>Conditional Rules (Complex)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-muted-foreground">
                  Apply different templates based on conditions. Example: different naming for mobile vs desktop campaigns.
                </p>
                <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                  <div className="font-mono text-sm">
                    <span className="text-muted-foreground">If device === 'mobile':</span> <code>mobile_{"{campaign}"}</code>
                  </div>
                  <div className="font-mono text-sm">
                    <span className="text-muted-foreground">Else:</span> <code>desktop_{"{campaign}"}</code>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Available Variables */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Available Variables Reference</CardTitle>
          </div>
          <CardDescription>
            These placeholders can be used in your template and formula rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Variable</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[250px]">Example Output</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><code className="px-2 py-1 rounded bg-muted">{"{platform}"}</code></TableCell>
                <TableCell>Advertising platform</TableCell>
                <TableCell className="text-muted-foreground">google, facebook, linkedin</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code className="px-2 py-1 rounded bg-muted">{"{campaign}"}</code></TableCell>
                <TableCell>Campaign name</TableCell>
                <TableCell className="text-muted-foreground">summer-sale, webinar-promo</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code className="px-2 py-1 rounded bg-muted">{"{entity}"}</code></TableCell>
                <TableCell>Business entity/brand</TableCell>
                <TableCell className="text-muted-foreground">nike, adidas</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code className="px-2 py-1 rounded bg-muted">{"{monthYY}"}</code></TableCell>
                <TableCell>Short month + 2-digit year</TableCell>
                <TableCell className="text-muted-foreground">nov25, dec25</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code className="px-2 py-1 rounded bg-muted">{"{monthYear}"}</code></TableCell>
                <TableCell>Full month + year</TableCell>
                <TableCell className="text-muted-foreground">nov2025, dec2025</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code className="px-2 py-1 rounded bg-muted">{"{monthFullYY}"}</code></TableCell>
                <TableCell>Full month name + 2-digit year</TableCell>
                <TableCell className="text-muted-foreground">November25, December25</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code className="px-2 py-1 rounded bg-muted">{"{city}"}</code></TableCell>
                <TableCell>Target city for location campaigns</TableCell>
                <TableCell className="text-muted-foreground">london, paris, dubai</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code className="px-2 py-1 rounded bg-muted">{"{webinar}"}</code></TableCell>
                <TableCell>Webinar name</TableCell>
                <TableCell className="text-muted-foreground">marketing-101, sales-workshop</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code className="px-2 py-1 rounded bg-muted">{"{device}"}</code></TableCell>
                <TableCell>Device targeting</TableCell>
                <TableCell className="text-muted-foreground">mobile, desktop, tablet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code className="px-2 py-1 rounded bg-muted">{"{lpUrl}"}</code></TableCell>
                <TableCell>Landing page URL</TableCell>
                <TableCell className="text-muted-foreground">signup, pricing, demo</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Common Examples */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle>Common Use Cases & Examples</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge>Example 1</Badge> Standard Campaign Naming
            </h4>
            <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
              <div><span className="text-muted-foreground">Use case:</span> Consistent platform-based campaign names</div>
              <div className="font-mono text-sm bg-background p-2 rounded">
                <span className="text-muted-foreground">Template:</span> <code>{"{platform}"}_{"{campaign}"}_{"{monthYY}"}</code>
              </div>
              <div className="font-mono text-sm bg-background p-2 rounded">
                <span className="text-muted-foreground">Output:</span> <code className="text-primary">google_summer-sale_nov25</code>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge>Example 2</Badge> Location-Based Campaigns
            </h4>
            <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
              <div><span className="text-muted-foreground">Use case:</span> Track performance by city/region</div>
              <div className="font-mono text-sm bg-background p-2 rounded">
                <span className="text-muted-foreground">Template:</span> <code>{"{platform}"}_{"{city}"}_{"{entity}"}_{"{monthYear}"}</code>
              </div>
              <div className="font-mono text-sm bg-background p-2 rounded">
                <span className="text-muted-foreground">Output:</span> <code className="text-primary">facebook_london_nike_nov2025</code>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge>Example 3</Badge> Device-Specific Tracking
            </h4>
            <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
              <div><span className="text-muted-foreground">Use case:</span> Separate mobile and desktop performance</div>
              <div className="font-mono text-sm bg-background p-2 rounded">
                <span className="text-muted-foreground">Template:</span> <code>{"{campaign}"}_{"{device}"}_{"{monthFullYY}"}</code>
              </div>
              <div className="font-mono text-sm bg-background p-2 rounded">
                <span className="text-muted-foreground">Output:</span> <code className="text-primary">promo_mobile_November25</code>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge>Example 4</Badge> Content-Based UTM Content
            </h4>
            <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
              <div><span className="text-muted-foreground">Use case:</span> Track which landing pages perform best</div>
              <div className="font-mono text-sm bg-background p-2 rounded">
                <span className="text-muted-foreground">Template:</span> <code>{"{lpUrl}"}_{"{campaign}"}</code>
              </div>
              <div className="font-mono text-sm bg-background p-2 rounded">
                <span className="text-muted-foreground">Output:</span> <code className="text-primary">pricing_summer-sale</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Use lowercase:</strong> Better readability in analytics (google_campaign vs GOOGLE_CAMPAIGN)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Avoid special characters:</strong> Stick to letters, numbers, hyphens, and underscores</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Keep it short:</strong> Long UTM parameters are hard to read and manage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Document your conventions:</strong> Create a naming guide for your team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Test before activating:</strong> Use the test panel to verify your rules work correctly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Start simple:</strong> Begin with template rules, then move to formulas as needed</span>
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle>Ready to Create Your First Rule?</CardTitle>
          <CardDescription className="text-base">
            Switch to the "Rules" tab to start building automation rules, or try the "Create New Rule" button to launch the rule builder.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
