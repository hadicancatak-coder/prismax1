import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = async (text: string, successMessage = 'Copied to clipboard') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast({
        title: 'Success',
        description: successMessage,
      });
      setTimeout(() => setCopiedText(null), 2000);
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
      return false;
    }
  };

  return { copy, copiedText };
}
