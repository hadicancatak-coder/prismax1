import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Download, Database, Trash2, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface TestResult {
  name: string;
  description: string;
  pass: boolean;
  duration_ms: number;
  error?: string;
}

interface QAReport {
  passed: boolean;
  summary: string;
  timestamp: string;
  tests: TestResult[];
}

export default function QAConsole() {
  const { userRole } = useAuth();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<QAReport | null>(null);
  const { toast } = useToast();

  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const runTests = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('qa-run-self-tests');

      if (error) throw error;

      setReport(data);
      
      if (data.passed) {
        toast({ 
          title: "✅ All Tests Passed!", 
          description: data.summary,
        });
      } else {
        toast({ 
          title: "❌ Tests Failed", 
          description: data.summary,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Test Suite Error", 
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const seedTestData = async () => {
    try {
      const { error } = await supabase.rpc('seed_qa_test_data');
      if (error) throw error;
      
      toast({ title: "Test data seeded successfully" });
    } catch (error: any) {
      toast({ 
        title: "Seed failed", 
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const purgeTestData = async () => {
    try {
      const { error } = await supabase.rpc('purge_qa_test_data');
      if (error) throw error;
      
      toast({ title: "Test data purged successfully" });
    } catch (error: any) {
      toast({ 
        title: "Purge failed", 
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const reloadSchema = async () => {
    try {
      // Force a schema reload by making a query
      const { error } = await supabase.from('tasks').select('id').limit(1);
      if (error) throw error;
      
      toast({ title: "Schema reloaded" });
    } catch (error: any) {
      toast({ 
        title: "Reload failed", 
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            QA Console
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated end-to-end testing for core functionality
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Button onClick={runTests} disabled={running} size="lg" className="h-auto py-4">
          <PlayCircle className="mr-2 h-5 w-5" />
          {running ? 'Running Tests...' : 'Run Full Test'}
        </Button>
        
        <Button onClick={reloadSchema} variant="outline" size="lg" className="h-auto py-4">
          <RefreshCw className="mr-2 h-5 w-5" />
          Reload Schema
        </Button>
        
        <Button onClick={seedTestData} variant="outline" size="lg" className="h-auto py-4">
          <Database className="mr-2 h-5 w-5" />
          Seed Test Data
        </Button>
        
        <Button onClick={purgeTestData} variant="outline" size="lg" className="h-auto py-4">
          <Trash2 className="mr-2 h-5 w-5" />
          Purge Test Data
        </Button>
        
        <Button 
          onClick={exportReport} 
          disabled={!report} 
          variant="outline" 
          size="lg" 
          className="h-auto py-4"
        >
          <Download className="mr-2 h-5 w-5" />
          Export Report
        </Button>
      </div>

      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Test Results
                  {report.passed ? (
                    <Badge variant="default" className="bg-success">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      All Passed
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      Failed
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {report.summary} • {new Date(report.timestamp).toLocaleString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-[auto,1fr,auto,auto,auto] gap-4 pb-2 border-b font-medium text-sm">
                <div>Status</div>
                <div>Test</div>
                <div>What it does</div>
                <div>Duration</div>
                <div>Error</div>
              </div>
              
              {report.tests.map((test, idx) => (
                <div 
                  key={idx}
                  className="grid grid-cols-[auto,1fr,auto,auto,auto] gap-4 py-3 border-b items-center hover:bg-muted/50 transition-colors"
                >
                  <div>
                    {test.pass ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-muted-foreground">{test.description}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {test.duration_ms}ms
                  </div>
                  <div className="text-sm text-destructive max-w-md truncate" title={test.error}>
                    {test.error || '—'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!report && !running && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Click "Run Full Test" to execute the automated test suite
          </CardContent>
        </Card>
      )}

      {running && (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Running automated tests...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
