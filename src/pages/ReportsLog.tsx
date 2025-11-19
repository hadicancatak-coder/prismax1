import { useState, useEffect } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { GoogleSheetPicker } from '@/components/reports/GoogleSheetPicker';
import { GoogleAPISetupGuide } from '@/components/reports/GoogleAPISetupGuide';
import { GoogleAPIConfig } from '@/components/reports/GoogleAPIConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, ExternalLink, FileSpreadsheet, Plus, Trash2, LogOut, Settings, Loader2 } from 'lucide-react';
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsLog() {
  // Check for API credentials in localStorage first, then fall back to env vars
  const getAPIKey = () => localStorage.getItem("GOOGLE_API_KEY") || import.meta.env.VITE_GOOGLE_API_KEY;
  const getClientId = () => localStorage.getItem("GOOGLE_CLIENT_ID") || import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  const [apiConfigured, setApiConfigured] = useState(false);
  
  useEffect(() => {
    setApiConfigured(!!(getAPIKey() && getClientId()));
  }, []);

  const { isAuthenticated, isLoading: authLoading, accessToken, signIn, signOut } = useGoogleAuth();
  const { sheets, isLoading, createSheet, saveSheet, deleteSheet, updateLastAccessed, isCreating } = useGoogleSheets(accessToken);
  const [newSheetName, setNewSheetName] = useState('');
  const [selectedSheet, setSelectedSheet] = useState<{ id: string; url: string } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreateSheet = () => {
    if (newSheetName.trim()) {
      createSheet(newSheetName);
      setNewSheetName('');
      setCreateDialogOpen(false);
    }
  };

  const handlePickerSelection = (sheet: { id: string; name: string; url: string }) => {
    saveSheet({
      sheetId: sheet.id,
      sheetUrl: sheet.url,
      sheetName: sheet.name,
    });
  };

  const handleOpenSheet = (sheet: any) => {
    setSelectedSheet({ id: sheet.sheet_id, url: sheet.sheet_url });
    updateLastAccessed(sheet.id);
  };

  const handleDeleteSheet = (id: string) => {
    if (confirm('Remove this sheet reference? The actual Google Sheet will not be deleted.')) {
      deleteSheet(id);
      if (selectedSheet && sheets.find(s => s.id === id)?.sheet_id === selectedSheet.id) {
        setSelectedSheet(null);
      }
    }
  };

  // Show setup guide if API is not configured
  if (!apiConfigured) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <PageHeader
          title="Reports Log"
          description="Integrate your Google Sheets for powerful reporting capabilities"
        />

        <Tabs defaultValue="guide" className="space-y-6">
          <TabsList>
            <TabsTrigger value="guide">Setup Guide</TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guide">
            <GoogleAPISetupGuide />
          </TabsContent>

          <TabsContent value="config">
            <GoogleAPIConfig onConfigured={() => setApiConfigured(true)} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6" />
              Reports Log
            </CardTitle>
            <CardDescription>
              Connect to Google Sheets to manage and access your reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sign in with your Google account to access and manage Google Sheets
              </AlertDescription>
            </Alert>
            <Button onClick={signIn} className="w-full">
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader
        title="Reports Log"
        description="Manage and access your Google Sheets reports"
        actions={<div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                API Config
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Google API Configuration</DialogTitle>
              </DialogHeader>
              <GoogleAPIConfig onConfigured={() => setApiConfigured(true)} />
            </DialogContent>
          </Dialog>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Sheets</CardTitle>
              <CardDescription>
                Manage your connected Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Sheet
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Google Sheet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Input
                        placeholder="Sheet name"
                        value={newSheetName}
                        onChange={(e) => setNewSheetName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateSheet()}
                      />
                    </div>
                    <Button onClick={handleCreateSheet} className="w-full" disabled={!newSheetName.trim()}>
                      Create Sheet
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {accessToken && (
                <GoogleSheetPicker
                  accessToken={accessToken}
                  onSheetSelected={handlePickerSelection}
                />
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sheets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sheets connected yet
                </p>
              ) : (
                <div className="space-y-2">
                  {sheets.map((sheet) => (
                    <Card
                      key={sheet.id}
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        selectedSheet?.id === sheet.sheet_id ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleOpenSheet(sheet)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {sheet.sheet_name}
                            </p>
                            {sheet.last_accessed_at && (
                              <p className="text-xs text-muted-foreground">
                                Last accessed: {new Date(sheet.last_accessed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSheet(sheet.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedSheet ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sheet Preview</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedSheet.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Sheets
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <iframe
                  src={`${selectedSheet.url}&rm=minimal`}
                  className="w-full h-[600px] border-0 rounded"
                  title="Google Sheet Preview"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[600px]">
                <div className="text-center space-y-2">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select a sheet to preview
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
