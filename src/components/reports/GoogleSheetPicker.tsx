import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface GoogleSheetPickerProps {
  accessToken: string;
  onSheetSelected: (sheet: { id: string; name: string; url: string }) => void;
}

export function GoogleSheetPicker({ accessToken, onSheetSelected }: GoogleSheetPickerProps) {
  useEffect(() => {
    loadGooglePicker();
  }, []);

  const loadGooglePicker = () => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('picker', () => {
        console.log('Google Picker API loaded');
      });
    };
    document.body.appendChild(script);
  };

  const openPicker = () => {
    if (!window.gapi?.picker || !window.google?.picker) {
      console.error('Google Picker not loaded');
      return;
    }

    const picker = new window.google.picker.PickerBuilder()
      .setOAuthToken(accessToken)
      .setDeveloperKey(GOOGLE_API_KEY!)
      .setAppId(GOOGLE_CLIENT_ID!.split('.')[0])
      .addView(
        new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS)
          .setMode(window.google.picker.DocsViewMode.LIST)
      )
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          onSheetSelected({
            id: doc.id,
            name: doc.name,
            url: doc.url,
          });
        }
      })
      .build();

    picker.setVisible(true);
  };

  return (
    <Button onClick={openPicker} variant="outline">
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Browse Google Sheets
    </Button>
  );
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}
