import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DisplayAdPreview } from "./DisplayAdPreview";

interface DisplayAdPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  longHeadline: string;
  shortHeadlines: string[];
  descriptions: string[];
  ctaText: string;
  landingPage: string;
  language: string;
}

export function DisplayAdPreviewDialog({
  open,
  onOpenChange,
  businessName,
  longHeadline,
  shortHeadlines,
  descriptions,
  ctaText,
  landingPage,
  language
}: DisplayAdPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Display Ad Preview</DialogTitle>
        </DialogHeader>
        <DisplayAdPreview
          businessName={businessName}
          longHeadline={longHeadline}
          shortHeadlines={shortHeadlines}
          descriptions={descriptions}
          ctaText={ctaText}
          landingPage={landingPage}
          language={language}
        />
      </DialogContent>
    </Dialog>
  );
}
