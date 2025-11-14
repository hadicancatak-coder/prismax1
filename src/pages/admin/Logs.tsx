import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Activity } from "lucide-react";
import ErrorLogs from "./ErrorLogs";
import AuditLog from "./AuditLog";

export default function Logs() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-section-title">System Logs</h2>
        <p className="text-muted-foreground mt-1">Monitor errors and track administrative activities</p>
      </div>

      <Tabs defaultValue="errors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="errors" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Error Logs
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="errors" className="mt-0">
          <ErrorLogs />
        </TabsContent>
        
        <TabsContent value="activity" className="mt-0">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
