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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GoogleSheetsReports() {
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Google Sheets Reports</h1>
          <p className="text-muted-foreground">
            Integrate your Google Sheets for powerful reporting capabilities
          </p>
        </div>

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
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Connect to Google Sheets</CardTitle>
            <CardDescription>
              Sign in with Google to create, browse, and embed Google Sheets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signIn} className="w-full">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Google Sheets Reports</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage Google Sheets directly from the app
          </p>
        </div>
        <Button onClick={signOut} variant="outline" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar with sheet list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  New Sheet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Google Sheet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Sheet name"
                    value={newSheetName}
                    onChange={(e) => setNewSheetName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSheet()}
                  />
                  <Button onClick={handleCreateSheet} disabled={isCreating || !newSheetName.trim()} className="w-full">
                    Create
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Your Sheets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : sheets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sheets yet</p>
              ) : (
                sheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                      selectedSheet?.id === sheet.sheet_id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0" onClick={() => handleOpenSheet(sheet)}>
                        <p className="font-medium text-sm truncate">{sheet.sheet_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sheet.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(sheet.sheet_url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSheet(sheet.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main content area with embedded sheet */}
        <div className="lg:col-span-2">
          {selectedSheet ? (
            <Card className="h-[calc(100vh-12rem)]">
              <CardContent className="p-0 h-full">
                <iframe
                  src={`https://docs.google.com/spreadsheets/d/${selectedSheet.id}/edit?rm=embedded`}
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  title="Google Sheet"
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-12rem)] flex items-center justify-center">
              <CardContent className="text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a sheet from the list or create a new one
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
