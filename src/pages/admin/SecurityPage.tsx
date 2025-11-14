import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Shield } from "lucide-react";
import SecurityScans from "./SecurityScans";
import ApprovalsCenter from "./ApprovalsCenter";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-section-title">Security & Approvals</h2>
        <p className="text-muted-foreground mt-1">Monitor security scans and manage approval workflows</p>
      </div>

      <Tabs defaultValue="scans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="scans" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security Scans
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <Shield className="h-4 w-4" />
            Approvals
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="scans" className="mt-0">
          <SecurityScans />
        </TabsContent>
        
        <TabsContent value="approvals" className="mt-0">
          <ApprovalsCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
